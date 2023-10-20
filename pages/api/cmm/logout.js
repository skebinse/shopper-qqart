import {getConnectPool, result} from "../db";
import {deleteCookie} from "cookies-next";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        try {
            deleteCookie('enc_sh', {req, res});
            deleteCookie('tkn_sh', {req, res});

            res.status(200).json(result(''));
        } catch (e) {
            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium' } ).format(new Date()));
            console.log(e)
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}