import {hmac, verifyToken} from "../../../util/securityUtil";
import {result} from "../db";
import {deleteCookie, getCookie} from "cookies-next";

export default async function AuthNo(req, res) {

    const param = req.body;

    // 서버가 발급한 서명 쿠키의 인증번호 해시와 비교 (클라이언트가 보낸 해시는 사용하지 않음)
    const token = verifyToken('smsCfm', getCookie('sms_cfm', {req, res}));
    const isMatch = !!token && hmac('smsAuthNo', token.cphoneNo + ':' + param.cetino) === token.authNoHash;

    if(isMatch) {

        deleteCookie('sms_cfm', {req, res, path: '/'});
    }

    res.status(200).json(result(isMatch));
}
