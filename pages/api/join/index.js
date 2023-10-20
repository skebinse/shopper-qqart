import {getConnectPool, result} from "../db";
import {setCookie} from "cookies-next";

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
            const item = rows[0][0];

            // 쿠키 등록
            if(item.IS_LOGIN === 1) {
                setCookie('enc_sh', item.ENC_SHPR_ID, {

                    req, res, maxAge: 2592000, sameSite: 'strict', httpOnly: true,  secure: true
                });
            }

            res.status(200).json(result(item));
        } catch (e) {

            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
            console.log(e);

            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}