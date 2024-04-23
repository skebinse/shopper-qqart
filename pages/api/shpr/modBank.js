import {getConnectPool, result} from "../db";
import {getCookie} from "cookies-next";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;

        try {
            const encShprId = getCookie('enc_sh', {req, res});

            let query = `SELECT fnDecrypt(?, ?) AS SHPR_ID`;

            const [shprIdRow] = await conn.query(query, [encShprId, process.env.ENC_KEY]);
            const shprId = shprIdRow[0].SHPR_ID;
            
            query =`
                UPDATE T_SHPR_INFO
                   SET SHPR_BANK_NM = ?
                     , SHPR_BANK_ACNO = ?
                     , MDFC_DT = NOW()
                     , MDFC_ID = ?
                 WHERE SHPR_ID = ?
                   AND SHPR_SCSS_YN = 'N'
            `;
            const [rows] = await conn.query(query, [param.bankNm, param.bankNum, shprId, shprId]);

            res.status(200).json(result(rows[0]));
        } catch (e) {
            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
            console.log(e)
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}