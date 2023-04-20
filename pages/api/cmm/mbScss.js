import {getConnectPool, result} from "../db";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        try {
            const query =`
                UPDATE T_SHPR_INFO
                   SET SHPR_SCSS_YN = 'Y'
                     , SHPR_SCSS_YMD = NOW()
                     , MDFC_DT = NOW()
                     , MDFC_ID = fnDecrypt(?, ?)
                 WHERE SHPR_ID = fnDecrypt(?, ?)
                   AND SHPR_SCSS_YN = 'N'
            `;
            const [rows] = await conn.query(query, [req.headers['x-enc-user-id'], process.env.ENC_KEY, req.headers['x-enc-user-id'], process.env.ENC_KEY]);

            res.status(200).json(result(rows[0]));
        } catch (e) {
            console.log(e)
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}