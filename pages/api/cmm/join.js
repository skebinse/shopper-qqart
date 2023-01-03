import {getConnectPool, result} from "../db";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;

        const [rows, fields] = await conn.query('call spShprJoin(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
            param.userCrctno, param.userEmal, param.userNcnm, param.userPrfl, param.userTnalPrfl, 'KAKAO',
            param.userStdoCd, param.userZipc, param.userAddr, '', param.cphoneNo, param.userAddrLat,
            param.userAddrLot, '', '', param.atchFileUuid, param.shprSfitdText, process.env.ENC_KEY
        ]);

        res.status(200).json(result(rows[0][0]));
    });

}