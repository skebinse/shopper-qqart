import {getConnectPool, result} from "../db";
import {getAuthShprId} from "../../../util/authUtil";
import {getWekChckQuery} from "../../../util/shprAdjUtil";

/**
 * 배송 내역 (일자별 배송 · 검수 · 기타 정산 + 총 남은 정산 금액)
 * - 하루 단위 검수 / 주 단위 출금 방식 (2026-10-27~). www 쇼퍼 정산(/qktmzl/shpr/shprAdj.qq) 과 같은 기준
 */
export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;

        try {

            const shprId = await getAuthShprId(conn, req, res);

            if(!shprId) {
                return;
            }

            if(!/^\d{4}-\d{2}-\d{2}$/.test(param.fromDt || '') || !/^\d{4}-\d{2}-\d{2}$/.test(param.toDt || '')) {

                res.status(200).json(result('', '9999', '잘못된 요청입니다.'));
                return;
            }

            const resultMap = {};

            // 배송 목록 (날짜: 배달완료시각(UTC)의 KST 날짜, 없으면 주문일 - www getQkShprClShopDelyList 와 같은 기준)
            let [rows] = await conn.query(`
                SELECT *
                  FROM (
                        SELECT BB.ODER_USER_ID
                             , BB.ODER_RPRE_NO
                             , CC.SHOP_NM
                             , AA.ODER_DELY_AMT
                             , CASE
                                   WHEN IFNULL(AA.ODER_DELY_CPL_TIME, '') = '' THEN DATE_FORMAT(AA.ODER_YMD, '%Y-%m-%d')
                               ELSE DATE_FORMAT(DATE_ADD(AA.ODER_DELY_CPL_TIME, INTERVAL 9 HOUR), '%Y-%m-%d') END AS DELY_YMD
                             , IFNULL(AA.ODER_DELY_CPL_TIME, '') AS ODER_DELY_CPL_TIME
                          FROM T_ODER_USER_INFO BB
                               INNER JOIN T_ODER_INFO AA
                            ON AA.ODER_ID = BB.ODER_ID
                               INNER JOIN T_SHOP_MAG CC
                            ON CC.SHOP_ID = BB.SHOP_ID
                         WHERE BB.SHPR_ID = ?
                           AND BB.ODER_PGRS_STAT IN ('06', '07', '08')
                       ) AA
                 WHERE AA.DELY_YMD BETWEEN ? AND ?
              ORDER BY AA.DELY_YMD DESC
                     , AA.ODER_DELY_CPL_TIME DESC
                     , AA.ODER_USER_ID DESC
            `, [shprId, param.fromDt, param.toDt]);

            resultMap.delyList = rows;

            // 일자별 검수 (검수 취소 시 행이 지워짐, 이전 방식 행은 CHCK_AMT 가 NULL 이라 제외)
            [rows] = await conn.query(`
                SELECT DATE_FORMAT(SHPR_ADJ_STRT_YMD, '%Y-%m-%d') AS YMD
                     , DATE_FORMAT(DATE_ADD(SHPR_ADJ_CHCK_YMD, INTERVAL 9 HOUR), '%Y-%m-%d %H:%i') AS CHCK_DT
                     , SHPR_ADJ_CHCK_AMT AS CHCK_AMT
                     , IFNULL(SHPR_ADJ_CHCK_PAY_AMT, SHPR_ADJ_CHCK_AMT) AS PAY_AMT
                  FROM T_SHPR_ADJ_MAG
                 WHERE SHPR_ID = ?
                   AND SHPR_ADJ_KD = 'DELY'
                   AND SHPR_ADJ_CHCK_YMD IS NOT NULL
                   AND SHPR_ADJ_CHCK_AMT IS NOT NULL
                   AND SHPR_ADJ_STRT_YMD = SHPR_ADJ_END_YMD
                   AND SHPR_ADJ_STRT_YMD BETWEEN ? AND ?
            `, [shprId, param.fromDt, param.toDt]);

            resultMap.chckList = rows;

            // 기타 정산 (0원 행은 숨김)
            [rows] = await conn.query(`
                SELECT DATE_FORMAT(SHPR_OHRS_ADJ_YMD, '%Y-%m-%d') AS YMD
                     , SHPR_OHRS_ADJ_NM
                     , SHPR_OHRS_ADJ_AMT
                     , SHPR_OHRS_ADJ_TWH_YN
                     , SHPR_OHRS_ADJ_CMSS_YN
                  FROM T_SHPR_OHRS_ADJ_MAG
                 WHERE SHPR_ID = ?
                   AND SHPR_OHRS_ADJ_YMD BETWEEN ? AND ?
                   AND SHPR_OHRS_ADJ_AMT <> 0
              ORDER BY SHPR_OHRS_ADJ_YMD
                     , SHPR_OHRS_ADJ_ID
            `, [shprId, param.fromDt, param.toDt]);

            resultMap.ohrsAdjList = rows;

            // 총 남은 정산 금액 = 주별 실지급액 합 - 출금 합
            [rows] = await conn.query(`
                SELECT IFNULL((
                        SELECT SUM(WW.PAY - WW.FEE - WW.TWH)
                          FROM (${getWekChckQuery()}) WW
                       ), 0)
                     - IFNULL((
                        SELECT SUM(WTHD_AMT)
                          FROM T_SHPR_WEK_WTHD
                         WHERE SHPR_ID = ?
                       ), 0) AS REM_AMT
            `, [shprId, shprId]);

            resultMap.remAmt = Number(rows[0].REM_AMT);

            res.status(200).json(result(resultMap));
        } catch (e) {

            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}

