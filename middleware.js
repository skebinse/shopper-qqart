import {NextResponse} from "next/server";

/**
 * 관리자 대행(prx_sh 쿠키) 중에는 조회 API 만 허용한다.
 * - 허용 목록 방식: 새 API 가 생기면 기본으로 막힌다. 대행 중에도 써야 하는 조회 API 는 아래에 추가한다.
 * - 위치 저장은 화면이 계속 호출하므로 오류 대신 저장 없이 정상 응답한다.
 * - 대행 세션의 유효성(만료·종료)은 dplcLogin / getAuthShprId 에서 DB 로 확인한다(여기서는 쿠키 존재만 본다).
 */
const PROXY_ALLOW = [
    // [메서드 목록, 경로 정규식]
    [['POST'], /^\/api\/auth\/(proxy|proxyEnd)$/],
    [['POST'], /^\/api\/cmm\/dplcLogin$/],
    [['GET', 'POST'], /^\/api\/cmm\/(commCdList|getSystCrll|shopList|insLog)$/],
    [['GET', 'POST'], /^\/api\/btch\/(btchList|btchCompList)$/],
    [['GET', 'POST'], /^\/api\/btch\/(comp|ing|piupZone)\/\d+$/],
    [['GET', 'POST'], /^\/api\/btch\/\d+$/],
    [['GET'], /^\/api\/delyschd(\/\d+)?$/],
    [['GET', 'POST'], /^\/api\/mag\/anncs(\/\d+)?$/],
    [['GET', 'POST'], /^\/api\/out\/healthCheck$/],
    [['GET', 'POST'], /^\/api\/shpr\/(adjInfo|adjWekList|delyHity|getPsPsit|pointInfo|pointList)$/],
    [['GET'], /^\/api\/shpr\/myInfo$/],
];

export function middleware(req) {

    if(!req.cookies.get('prx_sh')) {

        return NextResponse.next();
    }

    const path = req.nextUrl.pathname;
    const method = req.method;

    if(path === '/api/cmm/insPsPsit') {

        return json(200, {data: '', resultCode: '0000'});
    }

    if(PROXY_ALLOW.some(([methods, re]) => methods.includes(method) && re.test(path))) {

        return NextResponse.next();
    }

    return json(403, {data: '', resultCode: '9999', resultMsg: '관리자 대행 중에는 할 수 없습니다.'});
}

function json(status, body) {

    return new NextResponse(JSON.stringify(body), {status, headers: {'Content-Type': 'application/json; charset=utf-8'}});
}

export const config = {
    matcher: '/api/:path*',
};
