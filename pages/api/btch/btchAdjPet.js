import {getConnectPool, result} from "../db";
import {getCookie} from "cookies-next";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;
        const encShprId = getCookie('enc_sh', {req, res});

        try {

            // 배송 완료 리스트
            let [rows] = await conn.query('call spInsShprAdjReq(fnDecrypt(?, ?), ?, ?, ?)',
                [encShprId, process.env.ENC_KEY, param.fromDt.replaceAll('-', ''), param.toDt.replaceAll('-', ''), param.adjAmt]);

            res.status(200).json(result(rows[0]));
        } catch (e) {

            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}