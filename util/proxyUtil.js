import {deleteCookie, getCookie} from "cookies-next";

/**
 * 관리자 대행 로그인 (www 관리자 쇼퍼 리스트 [퀵퀵쇼퍼] → /api/auth/proxy)
 * - www 가 T_AUTH_TKN 에 일회용 토큰(AUTH_TKN_SC='SHPR_LOGIN', ACES_MNBO='shpr-qq')을 만들고,
 *   이 앱이 사용 처리(USE_DT)한 뒤 그 토큰을 대행 쿠키(prx_sh) 값으로 쓴다.
 * - 대행 세션은 USE_DT + SESN_SEC 까지 유효. www 에서 SESN_SEC 를 줄이면 즉시 끊긴다.
 */
export const PROXY_COOKIE = 'prx_sh';
export const PROXY_TKN_SC = 'SHPR_LOGIN';
export const PROXY_ACES_MNBO = 'shpr-qq';

/**
 * 대행 쿠키가 있는지 (DB 확인 없이 쿠키 존재만 - 부작용 차단용)
 */
export function hasProxyCookie(req, res) {

    return !!getCookie(PROXY_COOKIE, {req, res});
}

/**
 * 유효한 대행 세션 조회
 * @returns {Promise<{shprId: number, admId: string, tkn: string, remainSec: number}|null>}
 */
export async function getProxySession(conn, req, res) {

    const tkn = getCookie(PROXY_COOKIE, {req, res});

    if(!tkn) {

        return null;
    }

    const [rows] = await conn.query(`
        SELECT SHPR_ID
             , RGI_ADM_ID
             , TIMESTAMPDIFF(SECOND, NOW(), USE_DT + INTERVAL SESN_SEC SECOND) AS REMAIN_SEC
          FROM T_AUTH_TKN
         WHERE AUTH_TKN = ?
           AND AUTH_TKN_SC = ?
           AND ACES_MNBO = ?
           AND USE_DT IS NOT NULL
           AND USE_DT + INTERVAL SESN_SEC SECOND > NOW()
    `, [String(tkn), PROXY_TKN_SC, PROXY_ACES_MNBO]);

    if(rows.length === 0 || !rows[0].SHPR_ID) {

        return null;
    }

    return {shprId: rows[0].SHPR_ID, admId: rows[0].RGI_ADM_ID, tkn: String(tkn), remainSec: rows[0].REMAIN_SEC};
}

/**
 * 대행 세션 쿠키 삭제 (쇼퍼 계정의 푸시 토큰 등 DB 값은 건드리지 않는다)
 */
export function clearProxyCookies(req, res) {

    deleteCookie(PROXY_COOKIE, {req, res, path: '/'});
    deleteCookie('enc_sh', {req, res, path: '/'});
    deleteCookie('tkn_sh', {req, res, path: '/'});
}

/**
 * 대행 사용 기록 (T_LOG_USER_INQR, www 발급 기록과 tkn 앞 8자로 대조)
 */
export async function insProxyLog(conn, req, {crud, shprId, admId, tkn, memo}) {

    const ip = String(req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim().substring(0, 20);

    await conn.query(`
        INSERT INTO T_LOG_USER_INQR(ACES_MNBO, ACES_LOG_IP, INQR_SCRN_URL, CRUD, INQR_MEMO, RGI_ID)
        VALUES (?, ?, ?, ?, ?, ?)
    `, [
        PROXY_ACES_MNBO,
        ip,
        String(req.url || '').split('?')[0].substring(0, 50),
        crud,
        `${memo} shprId=${shprId}, admId=${admId}, aces=${PROXY_ACES_MNBO}, tkn=${String(tkn).substring(0, 8)}`,
        /^\d+$/.test(String(admId ?? '')) ? Number(admId) : null,
    ]);
}
