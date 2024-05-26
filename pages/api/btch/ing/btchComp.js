import {getConnectPool, result} from "../../db";
import cmm from "../../../../js/common";
import {adminSendNtfy} from "../../../../util/smsUtil";
import {getCookie} from "cookies-next";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;
        const encShprId = getCookie('enc_sh', {req, res});
        let isError = false;

        try {

            await conn.beginTransaction();

            let query = `SELECT fnDecrypt(?, ?) AS SHPR_ID`;

            const [shprIdRow] = await conn.query(query, [encShprId, process.env.ENC_KEY]);
            const shprId = shprIdRow[0].SHPR_ID;

            if(process.env.NEXT_PUBLIC_RUN_MODE === 'local') {
                process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
            }

            query =`
                SELECT ODER_PGRS_STAT
                  FROM T_ODER_USER_INFO
                 WHERE ODER_USER_ID = ?
                   AND SHPR_ID = ?
                `;

            let [rows] = await conn.query(query, [param.oderUserId, shprId]);

            if(cmm.util.getNumber(rows[0].ODER_PGRS_STAT) >= 6) {

                await conn.commit();
                res.status(500).json(result('', '8000', '이미 배달이 완료된 건입니다.'));

                return;
            }

            query =`
                UPDATE T_ODER_USER_INFO
                   SET ODER_PGRS_STAT = '06'
                     , ODER_DELY_CPL_ATCH_FILE_UUID = ?
                     , ODER_DELY_CPL_DT = NOW()
                 WHERE ODER_USER_ID = ?
                   AND SHPR_ID = ?
                `;

            [rows] = await conn.query(query, [param.atchFileUuid, param.oderUserId, shprId]);

            // 픽업 자동정산
            query = `CALL spInsPiupAtmtAdj(?, fnDecrypt(?, ?), 'N')`;

            await conn.query(query, [param.oderUserId, encShprId, process.env.ENC_KEY]);

            // 쇼퍼 현재 주문 최대치 수정
            query = 'CALL spModShprPsOderMxva(fnDecrypt(?, ?))';

            await conn.query(query, [encShprId, process.env.ENC_KEY]);

            await conn.commit();
            res.status(200).json(result(rows));
        } catch (e) {
            if(conn) {
                await conn.rollback();
            }
            isError = true;
            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }

        if(!isError) {

            cmm.ajax({
                url: process.env.QQCART_URL + `/sendSmsNtfy.ax`,
                isLoaing: false,
                isExtr: true,
                data: {
                    pgrsStat: 'comp',
                    oderUserId: param.oderUserId,
                },
                success: res => {

                }
            });

            // admin 알림 발송
            adminSendNtfy(conn, {ntfyType: 'delyCpl', oderUserId: param.oderUserId});
        }
    });
}