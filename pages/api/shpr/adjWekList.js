import {getConnectPool, result} from "../db";
import {getAuthShprId} from "../../../util/authUtil";
import {getWekChckQuery} from "../../../util/shprAdjUtil";

/**
 * 주별 정산 내역 (검수 합계 + 출금, 출금만 있는 주도 한 줄)
 * - www getQkShprWthdHity(TP='W') 와 같은 계산. 누적 남은 금액은 화면에서 오래된 주부터 계산
 */
export default async function handler(req, res) {

    await getConnectPool(async conn => {

        try {

            const shprId = await getAuthShprId(conn, req, res);

            if(!shprId) {
                return;
            }

            const [rows] = await conn.query(`
                SELECT DATE_FORMAT(AA.WK, '%Y-%m-%d') AS WEK_STRT_YMD
                     , DATE_FORMAT(DATE_ADD(AA.WK, INTERVAL 6 DAY), '%Y-%m-%d') AS WEK_END_YMD
                     , SUM(AA.DAYS) AS CHCK_DAYS
                     , SUM(AA.PAY) AS PAY_AMT
                     , SUM(AA.FEE) AS FEE_AMT
                     , SUM(AA.TWH) AS TWH_AMT
                     , SUM(AA.PAY - AA.FEE - AA.TWH) AS NET_AMT
                     , IFNULL(MAX(AA.WTHD_AMT), 0) AS WTHD_AMT
                     , IFNULL(MAX(AA.WTHD_RMK), '') AS WTHD_RMK
                  FROM (
                        SELECT WK.WK, WK.DAYS, WK.PAY, WK.FEE, WK.TWH, NULL AS WTHD_AMT, NULL AS WTHD_RMK
                          FROM (${getWekChckQuery()}) WK
                     UNION ALL
                        SELECT WEK_STRT_YMD, 0, 0, 0, 0, WTHD_AMT, WTHD_RMK
                          FROM T_SHPR_WEK_WTHD
                         WHERE SHPR_ID = ?
                       ) AA
              GROUP BY AA.WK
              ORDER BY AA.WK DESC
            `, [shprId, shprId]);

            res.status(200).json(result(rows.map(row => ({
                ...row,
                CHCK_DAYS: Number(row.CHCK_DAYS),
                PAY_AMT: Number(row.PAY_AMT),
                FEE_AMT: Number(row.FEE_AMT),
                TWH_AMT: Number(row.TWH_AMT),
                NET_AMT: Number(row.NET_AMT),
                WTHD_AMT: Number(row.WTHD_AMT),
            }))));
        } catch (e) {

            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}
