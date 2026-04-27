import {getConnectPool, result} from "../../db";
import {adminSendNtfy} from "../../../../util/smsUtil";
import {getCookie} from "cookies-next";
import cmm from "../../../../js/common";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;
        const encShprId = getCookie('enc_sh', {req, res});

        try {

            let query = `SELECT fnDecrypt(?, ?) AS SHPR_ID`;

            const [shprIdRow] = await conn.query(query, [encShprId, process.env.ENC_KEY]);
            const shprId = shprIdRow[0].SHPR_ID;

            // 본인 배치 여부 확인
            query = `
                SELECT COUNT(1) AS CNT
                  FROM T_ODER_USER_INFO
                 WHERE ODER_USER_ID = ?
                   AND SHPR_ID = ?
                   AND ODER_PGRS_STAT != '06'
            `;

            let [chkRows] = await conn.query(query, [param.oderUserId, shprId]);

            if(chkRows[0].CNT === 0) {

                res.status(200).json(result(null, '9001', '내 배치가 아니거나 잘못된 배치입니다.'));
                return;
            }

            // 본인 배치 여부 확인
            query = `
                SELECT COUNT(1) AS CNT
                  FROM T_ODER_USER_INFO
                 WHERE ODER_USER_ID = ?
                   AND SHPR_ID = ?
                   AND ODER_PGRS_STAT = '05'
            `;

            [chkRows] = await conn.query(query, [param.oderUserId, shprId]);

            if(chkRows[0].CNT === 1) {

                res.status(200).json(result(null, '9002', '이미 배달시작된 배치입니다.'));
                return;
            }

            // 본인 배치 여부 확인
            query = `
                SELECT COUNT(1) AS CNT
                  FROM T_ODER_USER_INFO
                 WHERE ODER_USER_ID = ?
                   AND SHPR_ID = ?
                   AND ODER_PGRS_STAT IN ('06', '08')
            `;

            [chkRows] = await conn.query(query, [param.oderUserId, shprId]);

            if(chkRows[0].CNT === 1) {

                res.status(200).json(result(null, '9003', '이미 배달이 완료되었습니다.'));
                return;
            }

            query =`
                UPDATE T_ODER_USER_INFO
                   SET ODER_PGRS_STAT = CASE WHEN ODER_PGRS_STAT = '03' AND ODER_KD = 'DELY' THEN '04' ELSE '05' END
                     , ODER_DELY_STRT_DT = NOW()
                 WHERE ODER_USER_ID = ?
                   AND SHPR_ID = ?
                   AND ODER_PGRS_STAT != '06'
                `;

            const [rows] = await conn.query(query, [param.oderUserId, shprId]);

            // 고객에게 알림 전송(기존 배치 수락시 발송을 배달 시작 시로 변경)
            cmm.ajax({
                url: process.env.QQCART_URL + `/sendSmsNtfy.ax`,
                isLoaing: false,
                isExtr: true,
                data: {
                    pgrsStat: 'btch',
                    oderUserId: param.oderUserId,
                },
            });
            // admin 알림 발송
            adminSendNtfy(conn, {ntfyType: 'delyStrt', oderUserId: param.oderUserId});

            res.status(200).json(result(rows));
        } catch (e) {

            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}