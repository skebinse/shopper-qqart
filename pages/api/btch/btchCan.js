import {getConnectPool, result} from "../db";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;

        await conn.beginTransaction();

        try {
            let query =`
                INSERT INTO T_BTCH_CAN_HITY (
                        SHPR_ID,
                        ODER_USER_ID,
                        RGI_DT,
                        RGI_ID
                ) VALUES (
                        fnDecrypt(?, ?),
                        ?,
                        NOW(),
                        fnDecrypt(?, ?)
                )
            `;

            const [rows] = await conn.query(query, [req.headers['x-enc-user-id'], process.env.ENC_KEY, param.oderUserId, req.headers['x-enc-user-id'], process.env.ENC_KEY]);

            query =`
                UPDATE T_ODER_USER_INFO
                   SET SHPR_ID = NULL
                     , ODER_REQ_APV_ID = NULL
                     , ODER_PGRS_STAT = '02'
                     , ODER_REQ_APV_DT = NULL
                 WHERE ODER_USER_ID = ?
                   AND SHPR_ID = fnDecrypt(?, ?)
            `;

            await conn.query(query, [param.oderUserId, req.headers['x-enc-user-id'], process.env.ENC_KEY]);
            await conn.commit();
            res.status(200).json(result(rows));
        } catch (e) {

            console.log(e);
            await conn.rollback();
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}