import {getConnectPool, result} from "../db";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;

        try {
            let query =`
                SELECT COUNT(*) AS CNT
                  FROM T_ODER_USER_INFO
                 WHERE SHPR_ID = fnDecrypt(?, ?)
                   AND ODER_PGRS_STAT IN ('03', '04', '05')
            `;

            let [rows, fields] = await conn.query(query, [req.headers['x-enc-user-id'], process.env.ENC_KEY]);

            if(rows[0].CNT >= 3) {

                res.status(200).json(result('', '9999', '배치 동시진행은 3건까지 가능합니다.'));
            } else {

                query =`
                    SELECT COUNT(*) AS CNT
                      FROM T_ODER_USER_INFO
                     WHERE ODER_USER_ID = ?
                       AND SHPR_ID IS NOT NULL
                    `;

                [rows, fields] = await conn.query(query, [param.oderUserId]);

                if(rows[0].CNT > 0) {

                    res.status(200).json(result('', '9999', '이미 배치가 완료된 건입니다.'));
                } else {

                    query =`
                        UPDATE T_ODER_USER_INFO
                           SET SHPR_ID = fnDecrypt(?, ?)
                             , ODER_REQ_APV_ID = fnDecrypt(?, ?)
                             , ODER_PGRS_STAT = '03'
                             , ODER_REQ_APV_DT = NOW()
                         WHERE ODER_USER_ID = ?
                        `;

                    [rows, fields] = await conn.query(query, [req.headers['x-enc-user-id'], process.env.ENC_KEY, req.headers['x-enc-user-id'], process.env.ENC_KEY, param.oderUserId]);

                    res.status(200).json(result(rows));
                }

            }
        } catch (e) {

            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}