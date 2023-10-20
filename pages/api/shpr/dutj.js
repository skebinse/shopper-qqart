import {getConnectPool, result} from "../db";
import {getCookie} from "cookies-next";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;
        const encShprId = getCookie('enc_sh', {req, res});
        
        try {

            // 금일 업무시작 여부
            let query = `
                SELECT COUNT(*) AS CNT 
                     , fnDecrypt(?, ?) AS SHPR_ID
                  FROM T_SHPR_DUTJ_MAG
                 WHERE SHPR_ID = fnDecrypt(?, ?)
                   AND SHPR_DUTJ_YMD = DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 9 HOUR), '%Y-%m-%d')
                   AND SHPR_DUTJ_END_DT IS NULL
                `;

            let [row] = await conn.query(query, [encShprId, process.env.ENC_KEY, encShprId, process.env.ENC_KEY]);

            if(param.type === 'start') {

                if(row[0].CNT === 0) {

                    query = `
                        INSERT INTO T_SHPR_DUTJ_MAG (
                            SHPR_ID,
                            SHPR_DUTJ_YMD,
                            SHPR_DUTJ_STRT_DT,
                            SHPR_DUTJ_STRT_LAT,
                            SHPR_DUTJ_STRT_LOT,
                            SHPR_DUTJ_STRT_PSIT
                        ) VALUES (
                             fnDecrypt(?, ?),
                             DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 9 HOUR), '%Y-%m-%d'),
                             NOW(),
                             ?,
                             ?,
                             ?
                        )
                    `;

                    await conn.query(query, [encShprId, process.env.ENC_KEY, param.lat, param.lon, param.shprDutjStrtPsit]);
                }
            } else if(param.type === 'end') {

                if(row[0].CNT > 0) {
                    query = `
                        UPDATE T_SHPR_DUTJ_MAG
                           SET SHPR_DUTJ_END_DT = NOW()
                         WHERE SHPR_ID = fnDecrypt(?, ?)
                           AND SHPR_DUTJ_YMD = DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 9 HOUR), '%Y-%m-%d')
                           AND SHPR_DUTJ_END_DT IS NULL
                    `;

                    await conn.query(query, [encShprId, process.env.ENC_KEY]);
                }
            }

            res.status(200).json(result(row[0]));
        } catch (e) {
            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
            console.log(e)
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}