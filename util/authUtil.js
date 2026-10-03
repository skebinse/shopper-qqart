import {getCookie} from "cookies-next";
import {result} from "../pages/api/db";

/**
 * 로그인 쇼퍼 ID 조회 (API 공통 인증)
 * - 쿠키 enc_sh 복호화 결과가 없거나 탈퇴 계정이면 9000 응답 후 null 반환
 * - checkTkn: 중복로그인 토큰(tkn_sh) 비교 (cmm/dplcLogin 과 동일 기준)
 * - respond: false 면 인증 실패 시 응답하지 않고 null 만 반환
 * @param conn
 * @param req
 * @param res
 * @param options
 * @returns {Promise<number|null>}
 */
export async function getAuthShprId(conn, req, res, {checkTkn = true, respond = true} = {}) {

    const encShprId = getCookie('enc_sh', {req, res});
    const tknSh = getCookie('tkn_sh', {req, res});

    const fail = () => {

        if(respond) {

            res.status(200).json(result('', '9000', '로그인 후 이용가능합니다.\n로그인 화면으로 이동합니다.'));
        }

        return null;
    };

    if(!encShprId) {

        return fail();
    }

    const [rows] = await conn.query(`
        SELECT SHPR_ID
             , SHPR_DPLC_LOGIN_TKN
          FROM T_SHPR_INFO
         WHERE SHPR_ID = fnDecrypt(?, ?)
           AND SHPR_SCSS_YN = 'N'
    `, [encShprId, process.env.ENC_KEY]);

    if(rows.length === 0) {

        return fail();
    }

    // 로컬에서 운영 DB 접속 시 로그인 쿠키(tkn_sh)가 발급되지 않으므로 토큰 비교 제외 (cmm/dplcLogin 과 동일)
    const isLocalProdDb = process.env.NEXT_PUBLIC_RUN_MODE === 'local' && process.env.DB_PROD_YN === 'Y';

    if(checkTkn && !isLocalProdDb && rows[0].SHPR_DPLC_LOGIN_TKN !== tknSh) {

        return fail();
    }

    return rows[0].SHPR_ID;
}
