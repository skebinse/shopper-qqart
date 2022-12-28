import formidable from "formidable"
import Upload from "./upload";
import {getConnectPol} from "../db";

export default async function handler(req, res) {

    await getConnectPol(async conn => {

        const param = req.body;

        const [rows, fields] = await conn.query('call spShprJoin(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
            param.userCrctno, param.userEmal, param.userNcnm, param.userPrfl, param.userTnalPrfl, 'KAKAO', param.userStdoCd,
            param.userZipc, param.userAddr, '', param.cphoneNo, param.userAddrLat, param.userAddrLot, '', '', param.atchFileUuid, param.shprSfitdText
        ]);

        res.status(200).json(rows[0][0]);
    });

}