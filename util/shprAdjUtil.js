/**
 * 쇼퍼 정산 (하루 단위 검수 · 주 단위 출금, 2026-10-27~)
 * www sql_admin.xml getQkShprWthdHity(TP='W') · getQkShprWthdList 와 같은 계산
 */

/**
 * 주별 검수 합계 쿼리 (바인딩: 쇼퍼 ID 1개)
 * - 주 = 월요일(WK) ~ 일요일
 * - 수수료 · 원천세는 주 합계에서 소수점만 한 번 버림 (세금계산서 기준. 하루씩 버려 더하면 금액이 달라짐)
 * - 값을 나눠 저장하기 전 검수 행은 그날 실지급액을 지급 합으로, 수수료 · 원천세 0
 * - 실지급액 = PAY - FEE - TWH
 * @returns {string}
 */
export function getWekChckQuery() {

    return `
        SELECT DATE_SUB(SHPR_ADJ_STRT_YMD, INTERVAL WEEKDAY(SHPR_ADJ_STRT_YMD) DAY) AS WK
             , COUNT(1) AS DAYS
             , SUM(IFNULL(SHPR_ADJ_CHCK_PAY_AMT, SHPR_ADJ_CHCK_AMT)) AS PAY
             , TRUNCATE(SUM(IFNULL(SHPR_ADJ_CHCK_FEE_RAW, 0)), 0) AS FEE
             , TRUNCATE(SUM(IFNULL(SHPR_ADJ_CHCK_TWH_RAW, 0)), 0) AS TWH
          FROM T_SHPR_ADJ_MAG
         WHERE SHPR_ID = ?
           AND SHPR_ADJ_KD = 'DELY'
           AND SHPR_ADJ_CHCK_YMD IS NOT NULL
           AND SHPR_ADJ_CHCK_AMT IS NOT NULL
           AND SHPR_ADJ_STRT_YMD = SHPR_ADJ_END_YMD
      GROUP BY DATE_SUB(SHPR_ADJ_STRT_YMD, INTERVAL WEEKDAY(SHPR_ADJ_STRT_YMD) DAY)
    `;
}
