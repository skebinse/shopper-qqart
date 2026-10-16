import {deleteCookie, getCookie, setCookie} from "cookies-next";
import {signToken, verifyToken} from "./securityUtil";

/**
 * 가입 세션 (서명 쿠키, DB 저장 없음)
 * - 다날 본인인증 결과(이름/생년월일성별/휴대폰)와 계좌 실명확인 결과를 서버가 서명해 보관
 * - 가입 API 는 클라이언트가 보낸 값 대신 이 쿠키 값만 사용
 */
const COOKIE_NAME = 'join_sc';
const PURPOSE = 'joinSession';
const TTL_SEC = 60 * 60;

/**
 * 가입 세션 저장 (유효시간 1시간, 저장 시마다 갱신)
 * @param req
 * @param res
 * @param data
 */
export function setJoinSession(req, res, data) {

    setCookie(COOKIE_NAME, signToken(PURPOSE, data, TTL_SEC), {
        req, res, maxAge: TTL_SEC, path: '/', sameSite: 'lax', httpOnly: true, secure: true
    });
}

/**
 * 가입 세션 조회
 * @param req
 * @param res
 * @returns {object|null} 없거나 위변조/만료 시 null
 */
export function getJoinSession(req, res) {

    return verifyToken(PURPOSE, getCookie(COOKIE_NAME, {req, res}));
}

/**
 * 가입 세션 삭제
 * @param req
 * @param res
 */
export function clearJoinSession(req, res) {

    deleteCookie(COOKIE_NAME, {req, res, path: '/'});
}
