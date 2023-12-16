import {getConnectPool, result} from "../db";
import {deleteCookie, getCookie} from "cookies-next";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const encShprId = getCookie('enc_sh', {req, res});

        try {

            let query = `SELECT fnDecrypt(?, ?) AS SHPR_ID`;

            const [shprIdRow] = await conn.query(query, [encShprId, process.env.ENC_KEY]);
            const shprId = shprIdRow[0].SHPR_ID;
            query = `
                UPDATE T_SHPR_INFO
                   SET SHPR_APP_PUSH_TKN = NULL
                 WHERE SHPR_ID = ?
                   AND SHPR_SCSS_YN = 'N'
            `;

            await conn.query(query, [shprId]);

            deleteCookie('enc_sh', {req, res});
            deleteCookie('tkn_sh', {req, res});

            res.status(200).json(result(''));
        } catch (e) {
            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium' } ).format(new Date()));
            console.log(e)
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}