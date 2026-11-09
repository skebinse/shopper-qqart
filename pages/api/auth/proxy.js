import {getConnectPool} from "../db";
import {setCookie, deleteCookie} from "cookies-next";
import {PROXY_ACES_MNBO, PROXY_COOKIE, PROXY_TKN_SC, insProxyLog} from "../../../util/proxyUtil";

/**
 * 관리자 대행 로그인 수신 (www 관리자 쇼퍼 리스트 [퀵퀵쇼퍼] → 새 탭 form POST, 파라미터 t)
 * - 일회용 토큰을 사용 처리한 뒤 대행 쿠키를 발급하고, 작은 HTML 로 로그인 정보(LS)를 세팅한 다음 메인으로 이동한다.
 *   (다른 사이트에서 넘어온 POST 응답에서 바로 302 하면 sameSite=strict 쿠키가 다음 요청에 안 실릴 수 있어 HTML 로 이동)
 * - 로그인 SP(spGetShprLogin)를 호출하지 않고 tkn_sh 도 만들지 않는다 → 쇼퍼 폰의 로그인·푸시 토큰 유지
 */
export default async function handler(req, res) {

    if(req.method !== 'POST') {

        res.setHeader('Allow', 'POST');
        sendHtml(res, 405, errorHtml('잘못된 접근입니다.'));
        return;
    }

    const tkn = String(req.body?.t ?? '');

    if(!/^[A-Za-z0-9_-]{16,64}$/.test(tkn)) {

        sendHtml(res, 400, errorHtml('잘못된 접근입니다.'));
        return;
    }

    await getConnectPool(async conn => {

        try {

            // 1) 일회용 토큰 사용 처리 (1건일 때만 성공)
            const [upd] = await conn.query(`
                UPDATE T_AUTH_TKN
                   SET USE_DT = NOW()
                 WHERE AUTH_TKN = ?
                   AND AUTH_TKN_SC = ?
                   AND ACES_MNBO = ?
                   AND USE_DT IS NULL
                   AND EXPR_DT > NOW()
            `, [tkn, PROXY_TKN_SC, PROXY_ACES_MNBO]);

            if(upd.affectedRows !== 1) {

                sendHtml(res, 401, errorHtml('만료되었거나 이미 사용된 대행 링크입니다.\n관리자 화면에서 다시 시도해 주세요.'));
                return;
            }

            // 2) 대상 쇼퍼·발급 관리자·세션 시간
            const [rows] = await conn.query(`
                SELECT A.SHPR_ID
                     , A.RGI_ADM_ID
                     , IFNULL(A.SESN_SEC, 3600) AS SESN_SEC
                     , B.SHPR_NCNM
                     , B.SHPR_ADDR
                     , B.SHPR_GRD_CD
                     , TO_BASE64(AES_ENCRYPT(B.SHPR_ID, ?)) AS ENC_SHPR_ID
                     , fnGetAtchFileList(B.SHPR_PRFL_ATCH_FILE_UUID) AS SHPR_PRFL_FILE
                     , DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 9 HOUR), '%Y%m%d') AS LOING_DT
                  FROM T_AUTH_TKN A
                       INNER JOIN T_SHPR_INFO B
                    ON B.SHPR_ID = A.SHPR_ID
                   AND B.SHPR_SCSS_YN = 'N'
                   AND B.SHPR_SYSTEM = ?
                 WHERE A.AUTH_TKN = ?
            `, [process.env.ENC_KEY, process.env.NEXT_PUBLIC_SYSTEM, tkn]);

            const item = rows[0];

            if(!item || !(item.SESN_SEC > 0)) {

                sendHtml(res, 404, errorHtml('대행할 수 없는 쇼퍼입니다.\n(탈퇴했거나 다른 시스템 쇼퍼)'));
                return;
            }

            // 3) 대행 쿠키 발급 (enc_sh 는 이 쇼퍼, prx_sh 는 사용된 토큰. tkn_sh 는 만들지 않음)
            const cookieOpt = {
                req, res, maxAge: item.SESN_SEC, path: '/', sameSite: 'strict',
                httpOnly: process.env.NEXT_PUBLIC_RUN_MODE !== 'local', secure: process.env.NEXT_PUBLIC_RUN_MODE !== 'local'
            };

            setCookie('enc_sh', item.ENC_SHPR_ID, cookieOpt);
            setCookie(PROXY_COOKIE, tkn, {...cookieOpt, httpOnly: true, secure: true});
            deleteCookie('tkn_sh', {req, res, path: '/'});

            // 사용 기록
            await insProxyLog(conn, req, {crud: 'L', shprId: item.SHPR_ID, admId: item.RGI_ADM_ID, tkn, memo: '관리자 대행 로그인'});

            const loginInfo = {
                IS_LOGIN: 1,
                SHPR_ADDR: item.SHPR_ADDR,
                LOING_DT: item.LOING_DT,
                SHPR_NCNM: item.SHPR_NCNM,
                SHPR_PRFL_FILE: item.SHPR_PRFL_FILE,
                LOGIN_VER: 'v1.0',
                SHPR_GRD_CD: item.SHPR_GRD_CD,
                PROXY_YN: 'Y',
                PROXY_EXPR: Date.now() + item.SESN_SEC * 1000,
            };

            sendHtml(res, 200, `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>관리자 대행</title></head>
<body><p style="font-family:sans-serif;padding:24px">대행 로그인 중입니다...</p>
<script>
(function() {
    var ls = window.localStorage;
    ls.removeItem('shprPsPsit');
    ls.setItem('shopperLoginInfo', JSON.stringify(${safeJson(loginInfo)}));
    location.replace('/');
})();
</script></body></html>`);
        } catch (e) {

            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium' } ).format(new Date()));
            console.log(e);
            sendHtml(res, 500, errorHtml('오류가 발생했습니다.'));
        }
    });
}

function sendHtml(res, status, html) {

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.status(status).send(html);
}

function safeJson(obj) {

    return JSON.stringify(obj).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

function errorHtml(msg) {

    const text = msg.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');

    return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>관리자 대행</title></head>
<body style="font-family:sans-serif;padding:24px;line-height:1.6"><p>${text}</p></body></html>`;
}
