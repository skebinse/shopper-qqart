import {getConnectPool, result, resultOne} from "../db";
import {adminSendNtfy} from "../../../util/smsUtil";
import {getCookie} from "cookies-next";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;
        const encShprId = getCookie('enc_sh', {req, res});

        try {
            if(process.env.NEXT_PUBLIC_RUN_MODE === 'local') {
                process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
            }

            // 배치 수락
            const query = 'CALL spInsShprBtchAcp(fnDecrypt(?, ?), ?, ?, ?, ?)';

            const [rows, fields] = await conn.query(query, [encShprId, process.env.ENC_KEY, param.oderUserId, param.oderPiupFrcsMi, param.shprPsitLat, param.shprPsitLot]);

            if(!rows[0]) {

                // 고객에게 알림 전송
                // cmm.ajax({
                //     url: process.env.QQCART_URL + `/sendSmsNtfy.ax`,
                //     isLoaing: false,
                //     isExtr: true,
                //     data: {
                //         pgrsStat: 'btch',
                //         oderUserId: param.oderUserId,
                //     },
                //     success: res => {
                //     }
                // });

                // admin 알림 발송
                adminSendNtfy(conn, {ntfyType: 'btchAcp', oderUserId: param.oderUserId});
            }

            res.status(200).json(resultOne(rows[0]));
        } catch (e) {

            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}