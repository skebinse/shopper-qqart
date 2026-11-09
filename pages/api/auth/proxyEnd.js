import {getConnectPool, result} from "../db";
import {getCookie} from "cookies-next";
import {PROXY_ACES_MNBO, PROXY_COOKIE, PROXY_TKN_SC, clearProxyCookies, insProxyLog} from "../../../util/proxyUtil";

/**
 * 관리자 대행 종료
 * - 대행 쿠키(prx_sh · enc_sh)만 지운다. 기존 logout 처럼 쇼퍼의 푸시 토큰을 NULL 로 만들지 않는다.
 * - 토큰의 세션 시간(SESN_SEC)을 사용 시점까지로 줄여 서버에서도 세션을 끝낸다.
 * - DB 오류가 나도 쿠키는 반드시 지운다 (남으면 대행 차단이 계속 걸림)
 */
export default async function handler(req, res) {

    if(req.method !== 'POST') {

        res.status(405).json(result('', '9999', '잘못된 요청입니다.'));
        return;
    }

    const tkn = getCookie(PROXY_COOKIE, {req, res});

    clearProxyCookies(req, res);

    try {

        if(!!tkn) {

            await getConnectPool(async conn => {

                const [rows] = await conn.query(`
                    SELECT SHPR_ID, RGI_ADM_ID
                      FROM T_AUTH_TKN
                     WHERE AUTH_TKN = ?
                       AND AUTH_TKN_SC = ?
                       AND ACES_MNBO = ?
                       AND USE_DT IS NOT NULL
                       AND USE_DT + INTERVAL SESN_SEC SECOND > NOW()
                `, [String(tkn), PROXY_TKN_SC, PROXY_ACES_MNBO]);

                if(rows.length > 0) {

                    await conn.query(`
                        UPDATE T_AUTH_TKN
                           SET SESN_SEC = GREATEST(TIMESTAMPDIFF(SECOND, USE_DT, NOW()), 0)
                         WHERE AUTH_TKN = ?
                           AND AUTH_TKN_SC = ?
                           AND ACES_MNBO = ?
                    `, [String(tkn), PROXY_TKN_SC, PROXY_ACES_MNBO]);

                    await insProxyLog(conn, req, {crud: 'LO', shprId: rows[0].SHPR_ID, admId: rows[0].RGI_ADM_ID, tkn, memo: '관리자 대행 종료'});
                }
            });
        }
    } catch (e) {

        console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium' } ).format(new Date()));
        console.log(e);
    }

    res.status(200).json(result(''));
}
