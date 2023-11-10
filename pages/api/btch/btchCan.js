import {getConnectPool, result} from "../db";
import Login from "../../cmm/login";
import {adminSendNtfy} from "../../../util/smsUtil";
import {getCookie} from "cookies-next";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;
        const encShprId = getCookie('enc_sh', {req, res});

        await conn.beginTransaction();

        try {

            let query = `SELECT fnDecrypt(?, ?) AS SHPR_ID`;

            const [shprIdRow] = await conn.query(query, [encShprId, process.env.ENC_KEY]);
            const shprId = shprIdRow[0].SHPR_ID;

            query =`
                SELECT SHOP_ID
                     , USER_ID
                  FROM T_ODER_USER_INFO
                 WHERE ODER_USER_ID = ?
                   AND SHPR_ID = ?
            `;

            const [oderRows] = await conn.query(query, [param.oderUserId, shprId]);

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
            `;

            await conn.query(query, [param.oderUserId, shprId]);
            await conn.commit();

            // admin 알림 발송
            adminSendNtfy(conn, {ntfyType: 'btchCan', oderUserId: param.oderUserId, encUserId: encShprId, encKey: process.env.ENC_KEY});

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