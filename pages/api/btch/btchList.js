import {getConnectPool, result} from "../db";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;

        let query = '';

        if(param.isLog === 'true') {

            const userAgent = req ? req.headers['user-agent'] : navigator.userAgent;
            const ip = req.headers["x-real-ip"] || req.connection.remoteAddress;
            const protocol = req ? 'https:' : 'http:'
            const host = req
                ? req.headers['x-forwarded-host'] || req.headers['host']
                : window.location.host

            query = `
                INSERT INTO T_ACES_LOG(ACES_LOG_BROW, ACES_LOG_SCRN_URL, ACES_LOG_IP, SHPR_ID)
                VALUES (?, ?, ?, fnDecrypt(?, ?))
            `;

            await conn.query(query, [userAgent, protocol + '//' + host, ip, req.headers['x-enc-user-id'], process.env.ENC_KEY]);
        }

        query = `
            SELECT IFNULL(TIMESTAMPDIFF(MINUTE, MAX(RGI_DT), NOW()), 60) AS MIN 
              FROM T_BTCH_CAN_HITY
             WHERE SHPR_ID = fnDecrypt(?, ?)
               AND BTCH_CAN_SANCT_YN = 'Y'
        `;

        const [row] = await conn.query(query, [req.headers['x-enc-user-id'], process.env.ENC_KEY]);
        let rows = [];

        if(row[0].MIN >= 60) {

            // 미배치 리스트
            query = `
                SELECT AA.ODER_MNGR_RGI_YN
                     , AA.ODER_RPRE_NO
                     , AA.SHOP_NM
                     , AA.PROD_CNT
                     , AA.SHOP_FULL_ADDR
                     , AA.ODER_DELY_FULL_ADDR
                     , AA.ODER_USER_ID
                     , AA.ODER_KD
                     , CEIL(TRUNCATE(AA.SLIN_DTC, 0) / 100) / 10 AS SLIN_DTC
                     , FORMAT(fnGetDelyDtcAmt(AA.ODER_USER_ID, AA.SHPR_ID, AA.ODER_DELY_DTC) + ODER_SHPR_TIP_AMT, 0) AS DELY_AMT
                     , fnGetAtchFileList(AA.SHOP_RRSN_ATCH_FILE_UUID) AS SHOP_RRSN_ATCH_FILE_LIST
                  FROM (
                    SELECT AA.ODER_MNGR_RGI_YN
                         , CASE WHEN AA.ODER_MNGR_RGI_YN = 'Y'
                             THEN AA.ODER_REQ_YMD
                           ELSE DATE_ADD(AA.ODER_REQ_YMD, INTERVAL 9 HOUR) END AS ODER_REQ_YMD
                         , AA.ODER_RPRE_NO
                         , AA.ODER_USER_ID
                         , AA.ODER_DELY_DTC
                         , AA.ODER_KD
                         , AA.ODER_SHPR_TIP_AMT
                         , BB.SHOP_NM
                         , BB.SHOP_RRSN_ATCH_FILE_UUID
                         , CONCAT(BB.SHOP_ADDR, ' ' , BB.SHOP_DTPT_ADDR) AS SHOP_FULL_ADDR
                         , CONCAT(AA.ODER_DELY_ADDR, ' ' , AA.ODER_DELY_DTPT_ADDR) AS ODER_DELY_FULL_ADDR
                         , IFNULL(DD.PROD_CNT, 0) AS PROD_CNT
                         , IFNULL(DD.SPBK_DELY_DTC, 0) AS SPBK_DELY_DTC
                         , BB.SHOP_ADDR_LAT
                         , BB.SHOP_ADDR_LOT
                         , ST_DISTANCE_SPHERE(POINT(BB.SHOP_ADDR_LAT, BB.SHOP_ADDR_LOT), POINT(EE.SHPR_ADDR_LAT, EE.SHPR_ADDR_LOT)) AS SLIN_DTC
                         , EE.SHPR_ID
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
               AND AA.ODER_REQ_YMD BETWEEN CONCAT(DATE_FORMAT(NOW(), '%Y-%m-%d'), ' 00:00:00') AND CONCAT(DATE_FORMAT(NOW(), '%Y-%m-%d'), ' 23:59:59')
          ORDER BY AA.ODER_REQ_YMD DESC
            `;

            [rows] = await conn.query(query, [req.headers['x-enc-user-id'], process.env.ENC_KEY]);
        }

        // 배치 리스트
        query = `
            SELECT AA.ODER_MNGR_RGI_YN
                 , AA.ODER_RPRE_NO
                 , AA.SHOP_NM
                 , AA.PROD_CNT
                 , AA.SHOP_FULL_ADDR
                 , AA.ODER_DELY_FULL_ADDR
                 , AA.ODER_USER_ID
                 , AA.ODER_KD
                 , CEIL(TRUNCATE(AA.SLIN_DTC, 0) / 100) / 10 AS SLIN_DTC
                 , FORMAT(fnGetDelyDtcAmt(AA.ODER_USER_ID, AA.SHPR_ID, AA.ODER_DELY_DTC) + AA.ODER_SHPR_TIP_AMT, 0) AS DELY_AMT
                 , fnGetAtchFileList(AA.SHOP_RRSN_ATCH_FILE_UUID) AS SHOP_RRSN_ATCH_FILE_LIST
              FROM (
                SELECT AA.ODER_MNGR_RGI_YN
                     , CASE WHEN AA.ODER_MNGR_RGI_YN = 'Y'
                         THEN AA.ODER_REQ_YMD
                       ELSE DATE_ADD(AA.ODER_REQ_YMD, INTERVAL 9 HOUR) END AS ODER_REQ_YMD
                     , AA.ODER_RPRE_NO
                     , AA.ODER_USER_ID
                     , AA.ODER_DELY_DTC
                     , AA.ODER_KD
                     , AA.ODER_SHPR_TIP_AMT
                     , BB.SHOP_NM
                     , BB.SHOP_RRSN_ATCH_FILE_UUID
                     , AA.ODER_DELY_ADDR
                     , CONCAT(BB.SHOP_ADDR, ' ' , BB.SHOP_DTPT_ADDR) AS SHOP_FULL_ADDR
                     , CONCAT(AA.ODER_DELY_ADDR, ' ' , AA.ODER_DELY_DTPT_ADDR) AS ODER_DELY_FULL_ADDR
                     , IFNULL(DD.PROD_CNT, 0) AS PROD_CNT
                     , IFNULL(DD.SPBK_DELY_DTC, 0) AS SPBK_DELY_DTC
                     , BB.SHOP_ADDR_LAT
                     , BB.SHOP_ADDR_LOT
                     , ST_DISTANCE_SPHERE(POINT(BB.SHOP_ADDR_LAT, BB.SHOP_ADDR_LOT), POINT(EE.SHPR_ADDR_LAT, EE.SHPR_ADDR_LOT)) AS SLIN_DTC
                     , EE.SHPR_ID
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
      ORDER BY AA.ODER_DELY_ADDR
             , AA.ODER_REQ_YMD DESC
        `;

        const [rows2] = await conn.query(query, [req.headers['x-enc-user-id'], process.env.ENC_KEY]);

        res.status(200).json(result({
            btchList: rows,
            btchAcpList: rows2,
            btchCanMin: row[0].MIN,
        }));
    });
}