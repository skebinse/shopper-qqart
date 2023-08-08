import {getConnectPool, result} from "../db";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;

        try {
            const [rows, fields] = await conn.query('call spShprJoin(?, ?, ?, ?, ?, ?, ' +
                                                                    '?, ?, ?, ?, ?, ?, ' +
                                                                    '?, ?, ?, ?, ?, ?, ' +
                                                                    '?, ?, ?, ?)', [
                param.userCrctno, param.userEmal, param.userNcnm, param.userPrfl, param.userTnalPrfl, param.userSnsType,
                param.userStdoCd, param.userZipc, param.userAddr, '', param.cphoneNo, param.userAddrLat,
                param.userAddrLot, '', '', param.atchFileUuid, param.shprSfitdText, process.env.ENC_KEY,
                param.userId, param.userPw, (param.appToken === 'null' ? '' : param.appToken), param.shprDelyPosDtc
            ]);

            res.status(200).json(result(rows[0][0]));
        } catch (e) {

            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
            console.log(e);

            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}