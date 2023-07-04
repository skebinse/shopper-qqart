import {getConnectPool, result} from "../db";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;
        try {

            // 금일 업무시작 여부
            let query = `
                SELECT COUNT(*) AS CNT 
                  FROM T_SHPR_DUTJ_MAG
                 WHERE SHPR_ID = fnDecrypt(?, ?)
                   AND SHPR_DUTJ_YMD = DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 9 HOUR), '%Y-%m-%d')
                   AND SHPR_DUTJ_END_DT IS NULL
                `;

            let [row] = await conn.query(query, [req.headers['x-enc-user-id'], process.env.ENC_KEY]);

            if(param.type === 'start') {

                if(row[0].CNT === 0) {

                    query = `
                       UPDATE T_SHPR_INFO
                          SET SHPR_MAX_DELY_NCN = 0
                            , SHPR_PS_ODER_MXVA_YN = 'N'
                        WHERE SHPR_ID = fnDecrypt(?, ?)
                          AND (SELECT COUNT(*) FROM T_SHPR_DUTJ_MAG WHERE SHPR_DUTJ_YMD = DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 9 HOUR), '%Y-%m-%d')) = 0
                    `;

                    await conn.query(query, [req.headers['x-enc-user-id'], process.env.ENC_KEY]);

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

                    await conn.query(query, [req.headers['x-enc-user-id'], process.env.ENC_KEY, param.lat, param.lon, param.shprDutjStrtPsit]);
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

                    await conn.query(query, [req.headers['x-enc-user-id'], process.env.ENC_KEY]);
                }
            }

            res.status(200).json(result(''));
        } catch (e) {
            console.log(e)
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}