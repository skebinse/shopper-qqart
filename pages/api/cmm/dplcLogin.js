import {getConnectPool, result} from "../db";
import {getCookie, setCookie} from "cookies-next";
import {clearProxyCookies, getProxySession, hasProxyCookie} from "../../../util/proxyUtil";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;
        const encShprId = getCookie('enc_sh', {req, res});
        const tknSh = getCookie('tkn_sh', {req, res});
        const excpUrlPathList = ['/api/cmm', '/api/join'];
        const excpUrlList = ['/api/join'];

        if(process.env.NEXT_PUBLIC_RUN_MODE === 'local' && process.env.DB_PROD_YN === 'Y') {

            res.status(200).json(result({result: 1}));
            return;
        }

        // 관리자 대행 세션: 대행 토큰이 유효하면 통과(쇼퍼 폰의 중복로그인 토큰과 비교하지 않음), 만료·종료됐으면 쿠키 삭제 후 로그인 화면으로
        if(hasProxyCookie(req, res)) {

            try {

                const proxy = await getProxySession(conn, req, res);

                if(!proxy) {

                    clearProxyCookies(req, res);
                }

                res.status(200).json(result({result: !!proxy ? 1 : -1, proxyYn: 'Y'}));
            } catch (e) {

                console.log(e);
                res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
            }

            return;
        }

        if(!!param.isExtr || excpUrlPathList.indexOf(param.url.substring(0, param.url.lastIndexOf('/'))) > -1 ||
            excpUrlList.indexOf(param.url) > -1) {

            res.status(200).json(result({result: 1}));
        } else {

            try {

                let query = `SELECT fnDecrypt(?, ?) AS SHPR_ID`;

                const [shprIdRow] = await conn.query(query, [encShprId, process.env.ENC_KEY]);
                const shprId = shprIdRow[0].SHPR_ID;

                const [rows] = await conn.query(`
                    SELECT SHPR_DPLC_LOGIN_TKN
                      FROM T_SHPR_INFO
                     WHERE SHPR_ID = ?
                `, [shprId]);

                if(!encShprId || rows.length === 0 || !rows[0].SHPR_DPLC_LOGIN_TKN) {

                    res.status(200).json(result({result: -1}));
                } else {

                    if(rows[0].SHPR_DPLC_LOGIN_TKN === tknSh) {

                        res.status(200).json(result({result: 1}));
                    } else {

                        res.status(200).json(result({result: 0}));
                    }
                }
            } catch (e) {
                console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium' } ).format(new Date()));
                console.log(e)
                res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
            }
        }
    });
}