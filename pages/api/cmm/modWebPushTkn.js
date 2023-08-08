import {getConnectPool, result} from "../db";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;

        try {
            const query =`
                UPDATE T_SHPR_INFO
                   SET SHPR_WEB_PUSH_TKN = ?
                 WHERE SHPR_ID = fnDecrypt(?, ?)
            `;
            const [rows] = await conn.query(query, [param.webPushTkn, req.headers['x-enc-user-id'], process.env.ENC_KEY]);

            res.status(200).json(result(rows[0]));
        } catch (e) {
            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
            console.log(e)
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}