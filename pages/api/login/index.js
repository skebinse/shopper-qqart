import {getConnectPool, result} from "../db";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;

        try {
            const [rows, fields, a,b] = await conn.query(`call spShprLogin(?, ?, ?, ?, ?, ?, ?)`, [param.encShprId, param.userCrctno, 'KAKAO', process.env.ENC_KEY, param.userId, param.userPw, param.appToken]);

            res.status(200).json(result(rows[0][0]));
        } catch (e) {
            console.log(e)
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}