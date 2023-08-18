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
                   , SHPR_PSIT_RGI_YMD
                   , RGI_DT
                ) VALUES (
                     shprId
                   , ?
                   , ?
                   , DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 9 HOUR), '%Y-%m-%d')
                   , NOW()
                )
            `;

            const [rows] = await conn.query(query, [param.shprId, param.lot, param.lat]);

            res.status(200).json(result(rows));
        } catch (e) {

            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}