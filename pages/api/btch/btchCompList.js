import {getConnectPool, result} from "../db";
import {getCookie} from "cookies-next";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;
        const encShprId = getCookie('enc_sh', {req, res});

        try {

            const [rows] = await conn.query('call spGetShprCompList(fnDecrypt(?, ?), ?, ?)',
                [encShprId, process.env.ENC_KEY, param.fromDt + ' 00:00:00', param.toDt + ' 23:59:59']);

            res.status(200).json(result(rows[0]));
        } catch (e) {

            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}