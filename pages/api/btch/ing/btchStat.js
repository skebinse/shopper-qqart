import {getConnectPool, result} from "../../db";
import {adminSendNtfy} from "../../../../util/smsUtil";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;
        let queryParam = [];

        try {

            let query =`
                UPDATE T_ODER_USER_INFO
                   SET ODER_PGRS_STAT = ?
                     , ODER_SHPP_STRT_DT = NOW()
                 WHERE ODER_USER_ID = ?
                   AND SHPR_ID = fnDecrypt(?, ?)
                   AND ODER_PGRS_STAT != '06'
                `;

            queryParam = [param.oderPgrsStat, param.oderUserId, req.headers['x-enc-user-id'], process.env.ENC_KEY];

            if(param.oderPgrsStat === '05') {
                query =`
                    UPDATE T_ODER_USER_INFO
                       SET ODER_PGRS_STAT = ?
                         , ODER_DELY_STRT_DT = NOW()
                         , ODER_PIUP_VCHR_ATCH_FILE_UUID = ?
                     WHERE ODER_USER_ID = ?
                       AND SHPR_ID = fnDecrypt(?, ?)
                       AND ODER_PGRS_STAT != '06'
                    `;

                queryParam = [param.oderPgrsStat, param.atchFileUuid, param.oderUserId, req.headers['x-enc-user-id'], process.env.ENC_KEY];
            }

            const [rows, fields] = await conn.query(query, queryParam);

            if(param.oderPgrsStat === '05') {

                // admin 알림 발송
                adminSendNtfy(conn, {ntfyType: 'delyStrt', oderUserId: param.oderUserId});
            }

            res.status(200).json(result(rows));
        } catch (e) {

            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}