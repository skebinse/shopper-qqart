import {getConnectPool, result} from "../../db";
import cmm from "../../../../js/common";
import {adminSendNtfy} from "../../../../util/smsUtil";
import {getAuthShprId} from "../../../../util/authUtil";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;
        let isError = false;

        let shprId;

        try {

            shprId = await getAuthShprId(conn, req, res);
        } catch (e) {

            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
            return;
        }

        if(!shprId) {

            return;
        }

        try {

            await conn.beginTransaction();

            if(process.env.NEXT_PUBLIC_RUN_MODE === 'local') {
                process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
            }

            // 동시 요청 시 정산 중복 방지를 위해 행 잠금
            let query =`
                SELECT ODER_PGRS_STAT
                  FROM T_ODER_USER_INFO
                 WHERE ODER_USER_ID = ?
                   AND SHPR_ID = ?
                   FOR UPDATE
                `;

            let [rows] = await conn.query(query, [param.oderUserId, shprId]);

            if(rows.length === 0) {

                await conn.rollback();
                res.status(200).json(result('', '9999', '배차된 주문이 아닙니다.'));

                return;
            }

            if(cmm.util.getNumber(rows[0].ODER_PGRS_STAT) >= 6) {

                await conn.commit();
                res.status(500).json(result('', '8000', '이미 배달이 완료된 건입니다.'));

                return;
            }

            // 배달 완료는 배달중(05)에서만 가능 (화면 노출 조건과 동일)
            query =`
                UPDATE T_ODER_USER_INFO
                   SET ODER_PGRS_STAT = '06'
                     , ODER_DELY_CPL_ATCH_FILE_UUID = ?
                     , ODER_DELY_CPL_DT = NOW()
                 WHERE ODER_USER_ID = ?
                   AND SHPR_ID = ?
                   AND ODER_PGRS_STAT = '05'
                `;

            [rows] = await conn.query(query, [param.atchFileUuid, param.oderUserId, shprId]);

            if(rows.affectedRows !== 1) {

                await conn.rollback();
                res.status(200).json(result('', '9999', '배달중 상태에서만 배달 완료할 수 있습니다.'));

                return;
            }

            // 픽업 자동정산
            query = `CALL spInsPiupAtmtAdj(?, ?, 'N')`;

            await conn.query(query, [param.oderUserId, shprId]);

            // 쇼퍼 현재 주문 최대치 수정
            query = 'CALL spModShprPsOderMxva(?)';

            await conn.query(query, [shprId]);

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
