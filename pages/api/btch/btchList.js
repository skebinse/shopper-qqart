import {getConnectPool, result} from "../db";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;
        let query = `
            SELECT IFNULL(TIMESTAMPDIFF(MINUTE, MAX(RGI_DT), NOW()), 60) AS MIN 
              FROM T_BTCH_CAN_HITY
             WHERE SHPR_ID = fnDecrypt(?, ?)
               AND BTCH_CAN_SANCT_YN = 'Y'
        `;

        const [row] = await conn.query(query, [req.headers['x-enc-user-id'], process.env.ENC_KEY]);
        let rows = [];

        if(row[0].MIN >= 60) {

            query = `
                SELECT AA.ODER_MNGR_RGI_YN
                     , AA.SHOP_NM
                     , AA.PROD_CNT
                     , AA.SHOP_FULL_ADDR
                     , AA.ODER_USER_ID
                     , AA.ODER_KD
                     , CEIL(TRUNCATE(AA.SLIN_DTC, 0) / 100) / 10 AS SLIN_DTC
                     , FORMAT(fnGetDelyDtcAmt(AA.ODER_DELY_DTC), 0) AS DELY_AMT
                     , fnGetAtchFileList(AA.SHOP_RRSN_ATCH_FILE_UUID) AS SHOP_RRSN_ATCH_FILE_LIST
                  FROM (
                    SELECT AA.ODER_MNGR_RGI_YN
                         , CASE WHEN AA.ODER_MNGR_RGI_YN = 'Y'
                             THEN AA.ODER_REQ_YMD
                           ELSE DATE_ADD(AA.ODER_REQ_YMD, INTERVAL 9 HOUR) END AS ODER_REQ_YMD
                         , AA.ODER_USER_ID
                         , AA.ODER_DELY_DTC
                         , AA.ODER_KD
                         , BB.SHOP_NM
                         , BB.SHOP_RRSN_ATCH_FILE_UUID
                         , CONCAT(BB.SHOP_ADDR, ' ' , BB.SHOP_DTPT_ADDR) AS SHOP_FULL_ADDR
                         , IFNULL(DD.PROD_CNT, 0) AS PROD_CNT
                         , IFNULL(DD.SPBK_DELY_DTC, 0) AS SPBK_DELY_DTC
                         , BB.SHOP_ADDR_LAT
                         , BB.SHOP_ADDR_LOT
                         , ST_DISTANCE_SPHERE(POINT(BB.SHOP_ADDR_LAT, BB.SHOP_ADDR_LOT), POINT(EE.SHPR_ADDR_LAT, EE.SHPR_ADDR_LOT)) AS SLIN_DTC
                      FROM T_ODER_USER_INFO AA
                           INNER JOIN T_SHOP_MAG BB
                        ON BB.SHOP_ID = AA.SHOP_ID
                           INNER JOIN T_USER_INFO CC
                        ON CC.USER_ID = AA.USER_ID
                       AND CC.USER_SCSS_YN = 'N'
                           LEFT OUTER JOIN
                            (
                            SELECT USER_ID
                                 , SHOP_ID
                                 , SPBK_DELY_DTC
                                 , ODER_USER_ID
                                 , COUNT(SHOP_ID) AS PROD_CNT
                              FROM T_USER_SPBK
                             WHERE SPBK_PGRS_STAT = '02'
                          GROUP BY USER_ID
                                 , SHOP_ID
                                 , SPBK_DELY_DTC
                                 , ODER_USER_ID
                            ) DD
                        ON AA.ODER_USER_ID = DD.ODER_USER_ID
                           INNER JOIN T_SHPR_INFO EE
                        ON EE.SHPR_ID = fnDecrypt(?, ?)
                     WHERE AA.ODER_ID IS NULL
                       AND AA.ODER_REQ_YMD IS NOT NULL
                       AND AA.ODER_REQ_APV_DT IS NULL
                   ) AA
             WHERE (AA.PROD_CNT > 0 OR AA.ODER_KD = 'PIUP')
               AND AA.SLIN_DTC < 15000
          ORDER BY AA.ODER_REQ_YMD DESC
            `;

            [rows] = await conn.query(query, [req.headers['x-enc-user-id'], process.env.ENC_KEY]);
        }

        query = `
            SELECT AA.ODER_MNGR_RGI_YN
                 , AA.SHOP_NM
                 , AA.PROD_CNT
                 , AA.SHOP_FULL_ADDR
                 , AA.ODER_USER_ID
                 , AA.ODER_KD
                 , CEIL(TRUNCATE(AA.SLIN_DTC, 0) / 100) / 10 AS SLIN_DTC
                 , FORMAT(fnGetDelyDtcAmt(AA.ODER_DELY_DTC), 0) AS DELY_AMT
                 , fnGetAtchFileList(AA.SHOP_RRSN_ATCH_FILE_UUID) AS SHOP_RRSN_ATCH_FILE_LIST
              FROM (
                SELECT AA.ODER_MNGR_RGI_YN
                     , CASE WHEN AA.ODER_MNGR_RGI_YN = 'Y'
                         THEN AA.ODER_REQ_YMD
                       ELSE DATE_ADD(AA.ODER_REQ_YMD, INTERVAL 9 HOUR) END AS ODER_REQ_YMD
                     , AA.ODER_USER_ID
                     , AA.ODER_DELY_DTC
                     , AA.ODER_KD
                     , BB.SHOP_NM
                     , BB.SHOP_RRSN_ATCH_FILE_UUID
                     , CONCAT(BB.SHOP_ADDR, ' ' , BB.SHOP_DTPT_ADDR) AS SHOP_FULL_ADDR
                     , IFNULL(DD.PROD_CNT, 0) AS PROD_CNT
                     , IFNULL(DD.SPBK_DELY_DTC, 0) AS SPBK_DELY_DTC
                     , BB.SHOP_ADDR_LAT
                     , BB.SHOP_ADDR_LOT
                     , ST_DISTANCE_SPHERE(POINT(BB.SHOP_ADDR_LAT, BB.SHOP_ADDR_LOT), POINT(EE.SHPR_ADDR_LAT, EE.SHPR_ADDR_LOT)) AS SLIN_DTC
                  FROM T_ODER_USER_INFO AA
                       INNER JOIN T_SHOP_MAG BB
                    ON BB.SHOP_ID = AA.SHOP_ID
                       INNER JOIN T_USER_INFO CC
                    ON CC.USER_ID = AA.USER_ID
                   AND CC.USER_SCSS_YN = 'N'
                       LEFT OUTER JOIN
                        (
                        SELECT USER_ID
                             , SHOP_ID
                             , SPBK_DELY_DTC
                             , ODER_USER_ID
                             , COUNT(SHOP_ID) AS PROD_CNT
                          FROM T_USER_SPBK
                         WHERE SPBK_PGRS_STAT = '02'
                      GROUP BY USER_ID
                             , SHOP_ID
                             , SPBK_DELY_DTC
                             , ODER_USER_ID
                        ) DD
                    ON AA.ODER_USER_ID = DD.ODER_USER_ID
                       INNER JOIN T_SHPR_INFO EE
                    ON EE.SHPR_ID = fnDecrypt(?, ?)
                   AND AA.SHPR_ID = EE.SHPR_ID
                 WHERE AA.ODER_ID IS NULL
                   AND AA.ODER_REQ_YMD IS NOT NULL
                   AND AA.ODER_PGRS_STAT IN ('03', '04', '05')
               ) AA
      ORDER BY AA.ODER_REQ_YMD DESC
        `;

        const [rows2] = await conn.query(query, [req.headers['x-enc-user-id'], process.env.ENC_KEY]);

        res.status(200).json(result({
            btchList: rows,
            btchAcpList: rows2,
            btchCanMin: row[0].MIN,
        }));
    });
}