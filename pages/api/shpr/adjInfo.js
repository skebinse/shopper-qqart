import {getConnectPool, result, resultOne} from "../db";
import {getCookie} from "cookies-next";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;

        try {
            const encShprId = getCookie('enc_sh', {req, res});

            let query = `SELECT fnDecrypt(?, ?) AS SHPR_ID`;

            const [shprIdRow] = await conn.query(query, [encShprId, process.env.ENC_KEY]);
            const shprId = shprIdRow[0].SHPR_ID;

            query = `
                SELECT *
                     , (SELECT SUM(A.SHPR_ADJ_AMT) + SUM(A.SHPR_ADJ_REM_AMT)
                          FROM T_SHPR_ADJ_MAG A
                         WHERE A.SHPR_ID = AA.SHPR_ID
                           AND A.SHPR_ADJ_APV_DT IS NOT NULL
                           AND A.SHPR_ADJ_KD = 'DELY') AS PY_AMT
                     , ODER_DELY_AMT + SUM_SHPR_OHRS_ADJ_AMT - CMSS_AMT - TWH_AMT AS LST_ADJ_AMT
                  FROM (
                      SELECT BB.SHPR_ID
                           , BB.SHPR_GRD_CD
                           , BB.SHPR_NCNM
                           , BB.SHPR_NAME
                           , BB.ODER_DELY_AMT
                           , IFNULL(CC.SUM_SHPR_OHRS_ADJ_AMT, 0) AS SUM_SHPR_OHRS_ADJ_AMT
                           , BB.CMSS_AMT + IFNULL(CC.CMSS_AMT, 0) AS CMSS_AMT
                           , TRUNCATE((BB.ODER_DELY_AMT + IFNULL(CC.SUM_SHPR_OHRS_ADJ_AMT, 0) - IFNULL(CC.SUM_THW_ECPT_AMT, 0) - (BB.CMSS_AMT + IFNULL(CC.CMSS_AMT, 0))) * 0.033, -1) AS TWH_AMT
                        FROM (
                            SELECT AA.SHPR_ID
                                 , AA.SHPR_GRD_CD
                                 , AA.SHPR_NCNM
                                 , AA.SHPR_NAME
                                 , SUM(AA.ODER_DELY_AMT) AS ODER_DELY_AMT
                                 , SUM(AA.CMSS_AMT) AS CMSS_AMT
                              FROM (
                                SELECT AA.SHPR_ID
                                     , AA.SHPR_GRD_CD
                                     , AA.SHPR_NCNM
                                     , AA.SHPR_NAME
                                     , IFNULL(AA.ODER_DELY_AMT, 0) AS ODER_DELY_AMT
                                     , IFNULL(TRUNCATE(AA.ODER_DELY_AMT * BB.SHPR_GRD_CMSS_RATE / 100, -1), 0) AS CMSS_AMT
                                  FROM (
                                        SELECT AA.SHPR_ID
                                             , AA.SHPR_GRD_CD
                                             , AA.SHPR_NCNM
                                             , AA.SHPR_NAME
                                             , DATE_FORMAT(DATE_ADD(BB.ODER_DELY_CPL_DT, INTERVAL 9 HOUR),'%Y-%m-%d') AS ODER_DELY_CPL_DT
                                             , CC.ODER_DELY_AMT
                                          FROM T_SHPR_INFO AA
                                               LEFT OUTER JOIN T_ODER_USER_INFO BB
                                            ON BB.SHPR_ID = AA.SHPR_ID
                                           AND BB.ODER_DELY_CPL_DT >= '2024-03-17 15:00:00'
                                           AND BB.ODER_PGRS_STAT = '08'
                                               LEFT OUTER JOIN T_ODER_INFO CC
                                            ON CC.ODER_ID = BB.ODER_ID
                                         WHERE AA.SHPR_ID = ?
                                       ) AA
                                         LEFT OUTER JOIN T_SHPR_GRD_HITY BB
                                      ON BB.SHPR_ID = AA.SHPR_ID
                                     AND BB.SHPR_GRD_STRT_YMD <= AA.ODER_DELY_CPL_DT
                                     AND BB.SHPR_GRD_END_YMD >= AA.ODER_DELY_CPL_DT
                                   ) AA
                            GROUP BY AA.SHPR_ID
                                   , AA.SHPR_GRD_CD
                                   , AA.SHPR_NCNM
                                   , AA.SHPR_NAME
                             ) BB
                               LEFT OUTER JOIN (
                                    SELECT AA.SHPR_ID
                                         , IFNULL(SUM(AA.SHPR_OHRS_ADJ_AMT), 0) AS SUM_SHPR_OHRS_ADJ_AMT
                                         , IFNULL(SUM(CASE WHEN AA.SHPR_OHRS_ADJ_TWH_YN = 'N' THEN AA.SHPR_OHRS_ADJ_AMT ELSE 0 END), 0) AS SUM_THW_ECPT_AMT
                                         , IFNULL(TRUNCATE(SUM(CASE WHEN AA.SHPR_OHRS_ADJ_CMSS_YN = 'Y' THEN AA.SHPR_OHRS_ADJ_AMT * BB.SHPR_GRD_CMSS_RATE / 100 ELSE 0 END), -1), 0) AS CMSS_AMT
                                      FROM T_SHPR_OHRS_ADJ_MAG AA
                                           LEFT OUTER JOIN T_SHPR_GRD_HITY BB
                                        ON BB.SHPR_ID = AA.SHPR_ID
                                       AND BB.SHPR_GRD_STRT_YMD <= AA.SHPR_OHRS_ADJ_YMD
                                       AND BB.SHPR_GRD_END_YMD >= AA.SHPR_OHRS_ADJ_YMD
                                  GROUP BY AA.SHPR_ID
                             ) CC
                            ON CC.SHPR_ID = BB.SHPR_ID
                             ) AA
            `;

            query = `
                SELECT SUM(A.SHPR_ADJ_AMT) + SUM(A.SHPR_ADJ_REM_AMT) AS PY_AMT
                  FROM T_SHPR_ADJ_MAG A
                 WHERE A.SHPR_ID = ?
                   AND A.SHPR_ADJ_APV_DT IS NOT NULL
                   AND A.SHPR_ADJ_KD = 'DELY'
            `;

            const [row] = await conn.query(query, [shprId]);

            query = `
                    SELECT DATE_FORMAT(SHPR_ADJ_STRT_YMD, '%Y년 %m월 %d일') AS SHPR_ADJ_STRT_YMD
                         , DATE_FORMAT(SHPR_ADJ_END_YMD, '%Y년 %m월 %d일') AS SHPR_ADJ_END_YMD
                         , DATE_FORMAT(SHPR_ADJ_PAR_YMD, '%Y년 %m월 %d일') AS SHPR_ADJ_PAR_YMD
                         , SHPR_ADJ_AMT
                         , DATE_FORMAT(DATE_ADD(SHPR_ADJ_REQ_DT, INTERVAL 9 HOUR),'%Y년 %m월 %d일') AS SHPR_ADJ_REQ_DT
                         , DATE_FORMAT(DATE_ADD(SHPR_ADJ_APV_DT, INTERVAL 9 HOUR),'%Y년 %m월 %d일') AS SHPR_ADJ_APV_DT
                      FROM T_SHPR_ADJ_MAG
                     WHERE SHPR_ID = ?
                       AND SHPR_ADJ_REQ_DT IS NOT NULL
                       AND SHPR_ADJ_KD = 'DELY'
            `;

            const [rows] = await conn.query(query, [shprId]);

            res.status(200).json(result({info: row[0], list: rows}));
        } catch (e) {

            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}