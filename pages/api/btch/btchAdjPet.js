import {getConnectPool, result} from "../db";
import {getCookie} from "cookies-next";

export default async function handler(req, res) {

    // 정산 출금 미사용 (2026-10-04) - 출금액을 클라이언트 값 그대로 SP 에 넘기는 문제(보안 C7)가 있어 차단.
    // 재사용 시 spInsShprAdjReq 에서 기간 정산액을 직접 계산하도록 수정한 뒤 해제할 것
    res.status(200).json(result('', '9999', '현재 출금 신청을 사용하지 않습니다.'));
    return;

    await getConnectPool(async conn => {

        const param = req.body;
        const encShprId = getCookie('enc_sh', {req, res});

        try {

            // 배송 완료 리스트
            let [rows] = await conn.query('call spInsShprAdjReq(fnDecrypt(?, ?), ?, ?, ?, ?)',
                [encShprId, process.env.ENC_KEY, param.fromDt.replaceAll('-', ''), param.toDt.replaceAll('-', ''), param.pyDt, param.adjAmt]);

            res.status(200).json(result(rows[0]));
        } catch (e) {

            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}