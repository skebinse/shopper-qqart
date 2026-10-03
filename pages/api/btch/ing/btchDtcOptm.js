import {getConnectPool, result} from "../../db";
import {adminSendNtfy} from "../../../../util/smsUtil";
import cmm from "../../../../js/common";
import {getCookie} from "cookies-next";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;
        const encShprId = getCookie('enc_sh', {req, res});

        try {

            let query = `SELECT fnDecrypt(?, ?) AS SHPR_ID`;

            const [shprIdRow] = await conn.query(query, [encShprId, process.env.ENC_KEY]);
            const shprId = shprIdRow[0].SHPR_ID;

            if(!shprId) {

                res.status(200).json(result('', '9000', '로그인 후 이용가능합니다.'));
                return;
            }

            // 주문 ID 는 숫자만 허용 (쿼리 바인딩)
            const oderUserIds = String(param.oderUserIds ?? '').split(',').map(id => id.trim()).filter(id => /^\d+$/.test(id));

            if(oderUserIds.length === 0) {

                res.status(200).json(result('', '9999', '잘못된 요청입니다.'));
                return;
            }

            query = `
                SELECT ODER_USER_ID
                     , ODER_DELY_ADDR_LAT
                     , ODER_DELY_ADDR_LOT
                  FROM T_ODER_USER_INFO
                 WHERE SHPR_ID = ?
                   AND ODER_USER_ID IN (?)
            `;

            const [rows] = await conn.query(query, [shprId, oderUserIds]);

            const data = {
                shopper: {
                    name: '쇼퍼',
                    latitude: Number(param.lat),
                    longitude: Number(param.lot)
                },
                deliveries: [{
                    shop: {
                        name: '쇼퍼',
                        latitude: Number(param.lat),
                        longitude: Number(param.lot)
                    },
                    destinations: []
                }],
            };

            if(rows.length > 0) {

                rows.forEach(item => {
                    data.deliveries[0].destinations.push({
                        name: String(item.ODER_USER_ID),
                        latitude: Number(item.ODER_DELY_ADDR_LOT),
                        longitude: Number(item.ODER_DELY_ADDR_LAT)
                    });
                });
            }

            // 커넥션 반환 전에 UPDATE 가 끝나도록 외부 호출 완료까지 대기
            await new Promise(resolve => {

                cmm.ajax({
                    url: process.env.ROAD_API_URL,
                    isExtr: true,
                    dataType: 'json',
                    headers: {
                        'x-api-key': process.env.ROAD_API_KEY
                    },
                    data,
                    success: async apiRes => {

                        try {

                            if(!!apiRes?.steps && apiRes.steps.length > 0) {

                                const query = `
                                        UPDATE T_ODER_USER_INFO
                                           SET ODER_OPTM_DTC_SEQ = ?
                                         WHERE SHPR_ID = ?
                                           AND ODER_USER_ID = ?
                                    `;

                                for(const [idx, item] of apiRes.steps.entries()) {

                                    await conn.query(query, [idx, shprId, item.name]);
                                }
                            }
                            res.status(200).json(result(apiRes));
                        } catch (e) {

                            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
                            console.log(e);
                            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
                        }
                        resolve();
                    },
                    error: () => {

                        res.status(200).json(result('', '9999', '최적 경로 조회에 실패했습니다.'));
                        resolve();
                    }
                });
            });

        } catch (e) {

            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}