import {getConnectPol} from "../db";

export default async function handler(req, res) {

    await getConnectPol(async conn => {

        const param = req.body;
        const query = `
            SELECT AA.ODER_MNGR_RGI_YN
                 , AA.SHOP_NM
                 , AA.PROD_CNT
                 , AA.SHOP_FULL_ADDR
                 , CEIL(TRUNCATE(AA.SLIN_DTC, 0) / 100) / 10 AS SLIN_DTC
                 , FORMAT(fnGetDelyDtcAmt(CEIL(TRUNCATE(AA.SLIN_DTC, 0) / 100) / 10), 0) AS DELY_AMT
                 , fnGetAtchFileList(AA.SHOP_RRSN_ATCH_FILE_UUID) AS SHOP_RRSN_ATCH_FILE_LIST
              FROM (
                SELECT AA.ODER_MNGR_RGI_YN
                     , AA.ODER_REQ_YMD
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
         WHERE (AA.PROD_CNT > 0 OR AA.ODER_MNGR_RGI_YN = 'Y')
           AND AA.SLIN_DTC < 10000
      ORDER BY AA.ODER_REQ_YMD DESC
        `;

        const [rows, fields] = await conn.query(query, [req.headers['x-enc-user-id'], process.env.ENC_KEY]);

        res.status(200).json(rows);
    });
}