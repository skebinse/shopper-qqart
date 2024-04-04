import {getConnectPool, result} from "../db";
import {getCookie} from "cookies-next";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;
        const encShprId = getCookie('enc_sh', {req, res});

        try {
            const query = `
                INSERT INTO T_LOG_MAG(
                     SHPR_ID
                   , LOG_KD
                   , LOG_PARAM
                   , LOG_RSLT
                ) VALUES (
                     fnDecrypt(?, ?)
                   , ?
                   , ?
                   , ?
                )
            `;

            const [rows] = await conn.query(query, [encShprId, process.env.ENC_KEY, param.logKd, param.logParam, param.logRslt]);

            res.status(200).json(result(rows));
        } catch (e) {

            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}