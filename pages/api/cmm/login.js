import {getConnectPool, result} from "../db";
import {getCookie, setCookie} from "cookies-next";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;
        const encShprId = getCookie('enc_sh', {req, res});

        try {
            const [rows] = await conn.query(`call spShprLogin(?, ?, ?, ?, ?, ?, ?)`, [encShprId, param.userCrctno, param.userSnsType, process.env.ENC_KEY, param.userId, param.userPw, (param.appToken === 'null' ? '' : param.appToken)]);
            const item = rows[0][0];

            // 쿠키 등록
            if(item.IS_LOGIN === 1) {
                setCookie('enc_sh', item.ENC_SHPR_ID, {
                    req, res, maxAge: 2592000, sameSite: 'strict', httpOnly: true,  secure: true
                });
                setCookie('tkn_sh', item.SHPR_DPLC_LOGIN_TKN, {
                    req, res, maxAge: 2592000, sameSite: 'strict', httpOnly: true,  secure: true
                });

                res.status(200).json(result({
                    IS_LOGIN: item.IS_LOGIN,
                    SHPR_ADDR: item.SHPR_ADDR,
                    LOING_DT: item.LOING_DT,
                    SHPR_NCNM: item.SHPR_NCNM,
                    SHPR_PRFL_FILE: item.SHPR_PRFL_FILE,
                    LOGIN_VER: item.LOGIN_VER,
                }));
            } else {

                res.status(200).json(result(item));
            }
        } catch (e) {
            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium' } ).format(new Date()));
            console.log(e)
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}