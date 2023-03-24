import {getConnectPool, result} from "../../db";
import cmm from "../../../../js/common";
import {adminSendNtfy} from "../../../../util/smsUtil";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;

        try {

            await conn.beginTransaction();
            if(process.env.NEXT_PUBLIC_RUN_MODE === 'local') {
                process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
            }

            cmm.ajax({
                url: process.env.QQCART_URL + `/sendSmsNtfy.ax`,
                isLoaing: false,
                isExtr: true,
                data: {
                    pgrsStat: 'comp',
                    oderUserId: param.oderUserId,
                },
                success: res => {

                    console.log(res)
                }
            });

            let query =`
                UPDATE T_ODER_USER_INFO
                   SET ODER_PGRS_STAT = '06'
                     , ODER_DELY_CPL_ATCH_FILE_UUID = ?
                     , ODER_DELY_CPL_DT = NOW()
                 WHERE ODER_USER_ID = ?
                   AND SHPR_ID = fnDecrypt(?, ?)
                `;

            let [rows, fields] = await conn.query(query, [param.atchFileUuid, param.oderUserId, req.headers['x-enc-user-id'], process.env.ENC_KEY]);

            // 픽업 자동정산
            query = `CALL spInsPiupAtmtAdj(?, fnDecrypt(?, ?), 'N')`;

            await conn.query(query, [param.oderUserId, req.headers['x-enc-user-id'], process.env.ENC_KEY]);

            // 쇼퍼 현재 주문 최대치 수정
            query = 'CALL spModShprPsOderMxva(fnDecrypt(?, ?))';

            await conn.query(query, [req.headers['x-enc-user-id'], process.env.ENC_KEY]);

            // admin 알림 발송
            adminSendNtfy(conn, {ntfyType: 'delyCpl', oderUserId: param.oderUserId});

            await conn.commit();
            res.status(200).json(result(rows));
        } catch (e) {
            if(conn) {
                conn.rollback();
            }
            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}