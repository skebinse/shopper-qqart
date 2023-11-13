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

            query = `
                SELECT ODER_USER_ID
                     , ODER_DELY_ADDR_LAT
                     , ODER_DELY_ADDR_LOT
                  FROM T_ODER_USER_INFO
                 WHERE SHPR_ID = ?
                   AND ODER_USER_ID IN (${param.oderUserIds})
            `;

            const [rows] = await conn.query(query, [shprId]);

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

            cmm.ajax({
                url: 'http://road.qqcart.shop/api/v1/eta/route',
                isExtr: true,
                dataType: 'json',
                headers: {
                    'x-api-key': 'r7!JbD*Qi4'
                },
                data,
                success: apiRes => {

                    if(!!apiRes.steps && apiRes.steps.length > 0) {

                        apiRes.steps.forEach((item, idx) => {

                            const query = `
                                    UPDATE T_ODER_USER_INFO
                                       SET ODER_OPTM_DTC_SEQ = ?
                                     WHERE SHPR_ID = ?
                                       AND ODER_USER_ID = ?
                                `;

                            conn.query(query, [idx, shprId, item.name]);
                        });
                    }
                    res.status(200).json(result(apiRes));
                }
            });

        } catch (e) {

            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}