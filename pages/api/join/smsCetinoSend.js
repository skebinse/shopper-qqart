import {smsSend} from "../../../util/smsUtil";
import {hmac, signToken} from "../../../util/securityUtil";
import {result} from "../db";
import {setCookie} from "cookies-next";

export default async function handler(req, res) {

    if(req.method !== 'POST' || !/^01\d{8,9}$/.test(String(req.body?.cphoneNo ?? ''))) {

        res.status(200).json(result('', '9999', '휴대폰 번호를 확인해 주세요.'));
        return;
    }

    const cphoneNo = req.body.cphoneNo;
    const authNo = Math.floor(1000 + Math.random() * 9000);

    // SMS 발송
    smsSend(cphoneNo, `[퀵퀵카트]인증번호는 ${authNo}입니다.정확히 입력해주세요.`, success => {

        // 인증번호는 클라이언트에 주지 않고 서명 쿠키(3분)에 해시로만 보관
        setCookie('sms_cfm', signToken('smsCfm', {cphoneNo, authNoHash: hmac('smsAuthNo', cphoneNo + ':' + authNo)}, 180), {
            req, res, maxAge: 180, path: '/', sameSite: 'strict', httpOnly: true, secure: true
        });

        res.status(200).json(result(!!success));
    });
}
