import {getConnectPol} from "../db";

export default async function handler(req, res) {

    await getConnectPol(async conn => {

        const data = req.body;
        try {
            const [rows, fields] = await conn.query(`call spShprLogin(?, ?, ?, ?)`, [data.encShprId, data.userCrctno, 'KAKAO', process.env.ENC_KEY]);

            res.status(200).json(rows[0][0]);
        } catch (e) {

            res.status(500).json({msg: '에러에러'});
        }
    });
}