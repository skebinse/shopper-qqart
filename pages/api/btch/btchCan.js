import {getConnectPool, result} from "../db";
import {adminSendNtfy} from "../../../util/smsUtil";
import {getAuthShprId} from "../../../util/authUtil";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;

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

        await conn.beginTransaction();

        try {

            // 배치 취소는 장보기/픽업 시작 전(03)이고 관리자 배정 건이 아닐 때만 가능 (화면 노출 조건과 동일)
            let query =`
                SELECT SHOP_ID
                     , USER_ID
                  FROM T_ODER_USER_INFO
                 WHERE ODER_USER_ID = ?
                   AND SHPR_ID = ?
                   AND ODER_PGRS_STAT = '03'
                   AND ODER_REQ_APV_MNGR_ID IS NULL
                   FOR UPDATE
            `;

            const [oderRows] = await conn.query(query, [param.oderUserId, shprId]);

            if(oderRows.length === 0) {

                await conn.rollback();
                res.status(200).json(result('', '9999', '취소할 수 없는 배치입니다.'));
                return;
            }

            query =`
                INSERT INTO T_BTCH_CAN_HITY (
                        SHOP_ID,
                        USER_ID,
                        SHPR_ID,
                        ODER_USER_ID,
                        RGI_DT,
                        RGI_ID
                ) VALUES (
                        ?,
                        ?,
                        ?,
                        ?,
                        NOW(),
                        ?
                )
            `;

            const [rows] = await conn.query(query, [oderRows[0].SHOP_ID, oderRows[0].USER_ID, shprId, param.oderUserId, shprId]);

            query =`
                UPDATE T_ODER_USER_INFO
                   SET SHPR_ID = NULL
                     , ODER_REQ_APV_ID = NULL
                     , ODER_PGRS_STAT = '02'
                     , ODER_REQ_APV_DT = NULL
                 WHERE ODER_USER_ID = ?
                   AND SHPR_ID = ?
                   AND ODER_PGRS_STAT = '03'
            `;

            await conn.query(query, [param.oderUserId, shprId]);
            await conn.commit();

            // admin 알림 발송
            adminSendNtfy(conn, {ntfyType: 'btchCan', oderUserId: param.oderUserId, shprId});

            res.status(200).json(result(rows));
        } catch (e) {

            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
            console.log(e);
            if(conn) {
                await conn.rollback();
            }
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}
