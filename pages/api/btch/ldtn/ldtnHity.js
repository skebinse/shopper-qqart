import {getConnectPool, result} from "../../db";
import {getCookie} from "cookies-next";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;
        const encShprId = getCookie('enc_sh', {req, res});

        try {
            const query = `
                INSERT INTO T_LDTN_HITY(
                    ODER_USER_ID,
                    LDTN_HITY_NO,
                    LDTN_HITY_FAIL_CD,
                    LDTN_HITY_FAIL_TEXT,
                    LDTN_HITY_AMT,
                    PAYMENT_KEY,
                    LDTN_HITY_DT,
                    LDTN_HITY_INFO,
                    LDTN_HITY_MNBO,
                    LDTN_HITY_RGI_ID
                ) VALUES (
                    ?,
                    ?,
                    (CASE WHEN ? = '' THEN NULL ELSE ? END),
                    ?,
                    ?,
                    ?,
                    NOW(),
                    ?,
                    'S',
                    fnDecrypt(?, ?)
                )
            `;

            const [rows, fields] = await conn.query(query, [param.oderUserId, param.orderId, param.failCd, param.failCd, param.failText, param.amt, param.paymentKey, param.ldtnInfo, encShprId, process.env.ENC_KEY]);

            res.status(200).json(result(rows));
        } catch (e) {

            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}