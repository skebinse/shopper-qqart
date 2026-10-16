import {getConnectPool, result} from "../db";
import {deleteCookie, getCookie} from "cookies-next";
import {getAuthShprId} from "../../../util/authUtil";
import {verifyToken} from "../../../util/securityUtil";
import {getBankNm} from "../../../js/bankList";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;

        try {

            const shprId = await getAuthShprId(conn, req, res);

            if(!shprId) {

                return;
            }

            // 계좌 실명확인(/api/join/bnkbSelfAhrz)에서 발급한 확인 쿠키의 본인·계좌와 일치할 때만 변경
            const bankVrf = verifyToken('bankVrf', getCookie('bank_vrf', {req, res}));

            if(!bankVrf || String(bankVrf.shprId) !== String(shprId) || bankVrf.bankNum !== param.bankNum) {

                res.status(200).json(result('', '9999', '계좌 실명확인 후 변경할 수 있습니다.\n다시 시도해 주세요.'));
                return;
            }

            const query =`
                UPDATE T_SHPR_INFO
                   SET SHPR_BANK_NM = ?
                     , SHPR_BANK_ACNO = ?
                     , MDFC_DT = NOW()
                     , MDFC_ID = ?
                 WHERE SHPR_ID = ?
                   AND SHPR_SCSS_YN = 'N'
            `;
            const [rows] = await conn.query(query, [getBankNm(bankVrf.bankCd), bankVrf.bankNum, shprId, shprId]);

            deleteCookie('bank_vrf', {req, res, path: '/'});

            res.status(200).json(result(rows[0]));
        } catch (e) {
            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
            console.log(e)
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}
