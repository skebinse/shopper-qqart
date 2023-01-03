import {smsSend} from "../../../util/smsUtil";
import {hash} from "../../../util/securityUtil";
import {result} from "../db";

export default async function handler(req, res) {

    const authNo = Math.floor(1000 + Math.random() * 9000);

    // SMS 발송
    smsSend(req.body.cphoneNo, `[퀵퀵카트]인증번호는 ${authNo}입니다.정확히 입력해주세요.`, success => {

        res.status(200).json(result(hash(authNo)));
    });
}