import {getConnectPool, result} from "../db";
import {getCookie} from "cookies-next";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;

        try {

            if(!!param.enc_sh) {

                const query = `
                       SELECT COUNT(1) AS CNT
                         FROM T_SYST_CRLL_MAG
                        WHERE SYST_CRLL_SC = ?
                          AND SHPR_ID = fnDecrypt(?, ?)`;

                const [rows] = await conn.query(query, [param.systCrllSc, param.enc_sh, process.env.ENC_KEY]);

                res.status(200).json(result(rows[0].CNT));
            } else {

                res.status(200).json(result(0));
            }
        } catch (e) {

            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}