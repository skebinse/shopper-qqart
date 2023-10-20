import {getConnectPool, result} from "../db";
import {getCookie} from "cookies-next";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;
        const encShprId = getCookie('enc_sh', {req, res});

        try {
            const query = `
                SELECT SHPR_PSIT_LAT
                     , SHPR_PSIT_LOT
                  FROM T_SHPR_PS_PSIT
                 WHERE SHPR_ID = fnDecrypt(?, ?)
              ORDER BY RGI_DT DESC
                 LIMIT 1
            `;

            const [rows] = await conn.query(query, [encShprId, process.env.ENC_KEY]);

            res.status(200).json(result(rows));
        } catch (e) {

            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}