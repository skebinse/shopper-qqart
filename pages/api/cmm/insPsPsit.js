import {getConnectPool, result} from "../db";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;

        try {
            const query = `
                INSERT INTO T_SHPR_PS_PSIT(
                     SHPR_ID
                   , SHPR_PSIT_LAT
                   , SHPR_PSIT_LOT
                   , RGI_DT
                ) VALUES (
                     fnDecrypt(?, ?)
                   , ?
                   , ?
                   , NOW()
                )
            `;

            const [rows] = await conn.query(query, [req.headers['x-enc-user-id'], process.env.ENC_KEY, param.lat, param.lot]);

            res.status(200).json(result(rows));
        } catch (e) {

            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}