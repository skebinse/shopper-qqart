import {getConnectPool, result} from "../db";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        try {
            const query = `
                SELECT SHPR_NCNM
                     , fnGetAtchFileList(SHPR_PRFL_ATCH_FILE_UUID) AS SHPR_PRFL_FILE
                     , fnGetShprPoint(SHPR_ID) AS SHPR_POIN
                  FROM T_SHPR_INFO
                 WHERE SHPR_ID = fnDecrypt(?, ?)
            `;

            const [rows] = await conn.query(query, [req.headers['x-enc-user-id'], process.env.ENC_KEY]);

            res.status(200).json(result(rows[0]));
        } catch (e) {

            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}