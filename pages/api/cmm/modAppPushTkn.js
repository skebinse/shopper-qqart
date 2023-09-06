import {getConnectPool, result} from "../db";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;

        try {
            const query = `
                UPDATE T_SHPR_INFO
                   SET SHPR_APP_PUSH_TKN = ?
                 WHERE SHPR_ID = fnDecrypt(?, ?)
            `;

            const [rows, fields] = await conn.query(query, [param.token, req.headers['x-enc-user-id'], process.env.ENC_KEY]);

            res.status(200).json(result(rows));
        } catch (e) {

            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}