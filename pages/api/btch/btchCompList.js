import {getConnectPool, result} from "../db";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        try {

            let query =`
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
                         , AA.ODER_DELY_CPL_DT
                         , AA.ODER_USER_ID
                         , AA.ODER_DELY_DTC
                         , AA.ODER_KD
                         , BB.SHOP_NM
                         , BB.SHOP_RRSN_ATCH_FILE_UUID
                         , CONCAT(BB.SHOP_ADDR, ' ' , BB.SHOP_DTPT_ADDR) AS SHOP_FULL_ADDR
                         , ST_DISTANCE_SPHERE(POINT(BB.SHOP_ADDR_LAT, BB.SHOP_ADDR_LOT), POINT(EE.SHPR_ADDR_LAT, EE.SHPR_ADDR_LOT)) AS SLIN_DTC
                         , IFNULL((SELECT COUNT(*) FROM T_ODER_DTPT A1 WHERE A1.ODER_ID = AA.ODER_ID), 0) AS PROD_CNT
                         , IFNULL((SELECT COUNT(*) FROM T_USER_SPBK A1 WHERE A1.ODER_USER_ID = AA.ODER_USER_ID), 0) AS SPBK_CNT
                      FROM T_ODER_USER_INFO AA
                           INNER JOIN T_SHOP_MAG BB
                        ON BB.SHOP_ID = AA.SHOP_ID
                           INNER JOIN T_SHPR_INFO EE
                        ON EE.SHPR_ID = fnDecrypt(?, ?)
                       AND EE.SHPR_ID = AA.SHPR_ID
                     WHERE AA.ODER_DELY_CPL_DT IS NOT NULL
                   ) AA
             WHERE ((AA.PROD_CNT + AA.SPBK_CNT) > 0 OR AA.ODER_KD = 'PIUP')
          ORDER BY AA.ODER_DELY_CPL_DT DESC
                `;

            const [rows] = await conn.query(query, [req.headers['x-enc-user-id'], process.env.ENC_KEY]);

            res.status(200).json(result(rows));
        } catch (e) {

            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}