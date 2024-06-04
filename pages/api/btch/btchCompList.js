import {getConnectPool, result} from "../db";
import {getCookie} from "cookies-next";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;
        const encShprId = getCookie('enc_sh', {req, res});

        try {

            let query = `SELECT fnDecrypt(?, ?) AS SHPR_ID`;
            const resultMap = {};

            const [shprIdRow] = await conn.query(query, [encShprId, process.env.ENC_KEY]);
            const shprId = shprIdRow[0].SHPR_ID;

            // 배송 완료 리스트
            let [rows] = await conn.query('call spGetShprCompList(?, ?, ?)',
                [shprId, param.fromDt + ' 00:00:00', param.toDt + ' 23:59:59']);

            resultMap.compList = rows[0];

            // 쇼퍼 수수료
            query = `
                SELECT AA.SHPR_GRD_YM
                     , AA.SHPR_GRD_CD
                     , AA.SHPR_GRD_CMSS_RATE
                     , CASE
                           WHEN DATEDIFF(DATE_ADD(NOW(), INTERVAL 9 HOUR), ?) >= 3 AND DAYOFWEEK(DATE_ADD(NOW(), INTERVAL 9 HOUR)) = 4 AND DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 9 HOUR), '%H') >= 18 THEN 'Y'
                           WHEN DATEDIFF(DATE_ADD(NOW(), INTERVAL 9 HOUR), ?) >= 3 AND DAYOFWEEK(DATE_ADD(NOW(), INTERVAL 9 HOUR)) = 5 THEN 'Y'
                           WHEN DATEDIFF(DATE_ADD(NOW(), INTERVAL 9 HOUR), ?) >= 3 AND DAYOFWEEK(DATE_ADD(NOW(), INTERVAL 9 HOUR)) = 6 AND DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 9 HOUR), '%H') < 18 THEN 'Y'
                       ELSE ${process.env.NEXT_PUBLIC_RUN_MODE === 'local' ? "'Y'" : "'N'"} END AS IS_WID
                     , (
                        SELECT CD_RMK
                          FROM T_CD_MAG
                         WHERE CD_ID = 218
                       ) AS ADJ_MAX_AMT
                  FROM T_SHPR_GRD_HITY AA
                 WHERE SHPR_ID = ?
                AND (
                        (AA.SHPR_GRD_STRT_YMD < ? AND AA.SHPR_GRD_END_YMD >= ?)
                    OR
                        (AA.SHPR_GRD_STRT_YMD <= ? AND AA.SHPR_GRD_END_YMD > ?)
                    OR
                        (AA.SHPR_GRD_STRT_YMD > ? AND AA.SHPR_GRD_END_YMD < ?)
                    )
           GROUP BY AA.SHPR_GRD_YM
                  , AA.SHPR_GRD_CD
                  , AA.SHPR_GRD_CMSS_RATE
            `;

            [rows] = await conn.query(query, [param.toDt, param.toDt, param.toDt, shprId, param.toDt, param.toDt, param.fromDt, param.fromDt, param.fromDt, param.toDt]);

            resultMap.shprGrdList = rows;

            // 기타 정산
            query = `
                SELECT SHPR_OHRS_ADJ_NM
                     , SHPR_OHRS_ADJ_AMT
                     , SHPR_OHRS_ADJ_CMSS_YN
                     , SHPR_OHRS_ADJ_TWH_YN
                     , DATE_FORMAT(SHPR_OHRS_ADJ_YMD, '%m') AS SHPR_OHRS_ADJ_MM
                  FROM T_SHPR_OHRS_ADJ_MAG
                 WHERE SHPR_ID = ?
                   AND SHPR_OHRS_ADJ_YMD >= ?
                   AND SHPR_OHRS_ADJ_YMD <= ?
            `;

            [rows] = await conn.query(query, [shprId, param.fromDt, param.toDt]);

            resultMap.ohrsAdjList = rows;

            // 출금여부
            query = `
                SELECT COUNT(CC.SHPR_ID) AS IS_REQ
                     , CC.SHPR_ADJ_CHCK_YMD
                     , CC.SHPR_ADJ_REQ_DT
                     , CC.SHPR_ADJ_APV_DT
                     , CC.SHPR_ADJ_AMT
                     , DATE_FORMAT(DATE_ADD(DATE_ADD((CASE WHEN CC.SHPR_ADJ_REQ_DT IS NULL THEN NOW() ELSE CC.SHPR_ADJ_REQ_DT END)
                        , INTERVAL 9 HOUR), INTERVAL BB.CD_RMK2 DAY), '%m월 %d일') AS PY_DT
                  FROM T_SHPR_INFO AA
                       INNER JOIN T_CD_MAG BB
                    ON BB.CD_SPPO_ID = 158
                   AND BB.CD_RMK = AA.SHPR_GRD_CD
                       LEFT OUTER JOIN T_SHPR_ADJ_MAG CC
                    ON CC.SHPR_ID = AA.SHPR_ID
                   AND CC.SHPR_ADJ_STRT_YMD = ?
                   AND CC.SHPR_ADJ_END_YMD = ?
                 WHERE AA.SHPR_ID = ?
            `;

            [rows] = await conn.query(query, [param.fromDt, param.toDt, shprId]);

            resultMap.widReqInfo = rows[0];

            res.status(200).json(result(resultMap));
        } catch (e) {

            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}