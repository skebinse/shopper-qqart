import {getConnectPool, result} from "../db";
import {getCookie, setCookie} from "cookies-next";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;
        const encShprId = getCookie('enc_sh', {req, res});
        const tknSh = getCookie('tkn_sh', {req, res});
        const excpUrlPathList = ['/api/cmm', '/api/join'];
        const excpUrlList = ['/api/join'];
        console.log(param)

        if(!!param.isExtr || excpUrlPathList.indexOf(param.url.substring(0, param.url.lastIndexOf('/'))) > -1 ||
            excpUrlList.indexOf(param.url) > -1) {

            res.status(200).json(result({result: 1}));
        } else {

            try {
                const [rows] = await conn.query(`
                    SELECT SHPR_DPLC_LOGIN_TKN
                      FROM T_SHPR_INFO
                     WHERE SHPR_ID = fnDecrypt(?, ?)
                `, [encShprId, process.env.ENC_KEY, tknSh]);
                console.log(rows[0])

                if(!!rows[0].SHPR_DPLC_LOGIN_TKN) {

                    if(rows[0].SHPR_DPLC_LOGIN_TKN === tknSh) {

                        res.status(200).json(result({result: 1}));
                    } else {

                        res.status(200).json(result({result: 0}));
                    }
                } else {

                    res.status(200).json(result({result: -1}));
                }
            } catch (e) {
                console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium' } ).format(new Date()));
                console.log(e)
                res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
            }
        }
    });
}