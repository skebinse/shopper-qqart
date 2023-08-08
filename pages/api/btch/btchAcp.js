import {getConnectPool, result, resultOne} from "../db";
import cmm from "../../../js/common";
import {adminSendNtfy} from "../../../util/smsUtil";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;

        try {
            if(process.env.NEXT_PUBLIC_RUN_MODE === 'local') {
                process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
            }

            const query = 'CALL spInsShprBtchAcp(fnDecrypt(?, ?), ?, ?)';

            const [rows, fields] = await conn.query(query, [req.headers['x-enc-user-id'], process.env.ENC_KEY, param.oderUserId, param.oderPiupFrcsMi]);

            if(!rows[0]) {

                cmm.ajax({
                    url: process.env.QQCART_URL + `/sendSmsNtfy.ax`,
                    isLoaing: false,
                    isExtr: true,
                    data: {
                        pgrsStat: 'btch',
                        oderUserId: param.oderUserId,
                    },
                    success: res => {
                    }
                });

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