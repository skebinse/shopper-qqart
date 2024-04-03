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
                           WHEN DATEDIFF(DATE_ADD(NOW(), INTERVAL 9 HOUR), ?) >= 3 AND DAYOFWEEK(DATE_ADD(NOW(), INTERVAL 9 HOUR)) = 4 AND DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 9 HOUR), '%H') < 18 THEN 'Y'
                           WHEN DATEDIFF(DATE_ADD(NOW(), INTERVAL 9 HOUR), ?) >= 3 AND DAYOFWEEK(DATE_ADD(NOW(), INTERVAL 9 HOUR)) = 5 THEN 'Y'
                           WHEN DATEDIFF(DATE_ADD(NOW(), INTERVAL 9 HOUR), ?) >= 3 AND DAYOFWEEK(DATE_ADD(NOW(), INTERVAL 9 HOUR)) = 6 AND DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 9 HOUR), '%H') < 18 THEN 'Y'
                       ELSE 'N' END AS IS_WID
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
                SELECT COUNT(1) AS IS_REQ
                     , SHPR_ADJ_APV_DT
                     , SHPR_ADJ_AMT
                  FROM T_SHPR_ADJ_MAG
                 WHERE SHPR_ID = ?
                   AND SHPR_ADJ_STRT_YMD = ?
                   AND SHPR_ADJ_END_YMD = ?
            `;

            [rows] = await conn.query(query, [shprId, param.fromDt, param.toDt]);

            resultMap.widReqInfo = rows[0];

            res.status(200).json(result(resultMap));
        } catch (e) {

            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}