import {getConnectPol} from "../db";

export default async function handler(req, res) {

    await getConnectPol(async conn => {

        const data = req.body;
        try {
            const [rows, fields] = await conn.query(`call spShprLogin(?, ?, ?, ?, ?, 'KAKAO', ?, ?)`, [data.userCrctno, data.userEmal,
                data.userNcnm, data.userPrfl, data.userTnalPrfl, '', '']);

            res.status(200).json(rows[0][0]);
        } catch (e) {

            res.status(500).json({msg: '에러에러'});
        }
    });
}