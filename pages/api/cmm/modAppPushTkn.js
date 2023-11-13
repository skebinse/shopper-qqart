import {getConnectPool, result} from "../db";
import {getCookie} from "cookies-next";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;
        const encShprId = getCookie('enc_sh', {req, res});

        try {

            let query = `SELECT fnDecrypt(?, ?) AS SHPR_ID`;

            const [shprIdRow] = await conn.query(query, [param.enc_sh, process.env.ENC_KEY]);
            const shprId = shprIdRow[0].SHPR_ID;

            query = `
                UPDATE T_SHPR_INFO
                   SET SHPR_APP_PUSH_TKN = ?
                 WHERE SHPR_ID = ?
            `;

            const [rows, fields] = await conn.query(query, [param.token, shprId]);

            res.status(200).json(result(rows));
        } catch (e) {

            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}