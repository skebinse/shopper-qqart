import {getConnectPool, result} from "../db";
import {getAuthShprId} from "../../../util/authUtil";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;

        try {

            const shprId = await getAuthShprId(conn, req, res);

            if(!shprId) {

                return;
            }

            // 본인에게 배차된 주문만 등록
            const query = `
                INSERT INTO T_ODER_EXCP (
                    ODER_USER_ID, -- 주문사용자 ID
                    ODER_EXCP_KD, -- 주문 예외 종류(과적, 주차비)
                    ODER_EXCP_ATCH_FILE_UUID, -- 주문 예외 첨부파일 UUID
                    RGI_DT, -- 등록 일시
                    RGI_ID -- 등록 ID
                )
                SELECT ODER_USER_ID
                     , ?
                     , ?
                     , NOW()
                     , ?
                  FROM T_ODER_USER_INFO
                 WHERE ODER_USER_ID = ?
                   AND SHPR_ID = ?`;

            const [rows, fields] = await conn.query(query, [param.oderExcpKd, param.atchFileUuid, shprId, param.oderUserId, shprId]);

            if(rows.affectedRows === 0) {

                res.status(200).json(result('', '9999', '배차된 주문이 아닙니다.'));
                return;
            }

            res.status(200).json(result(rows));
        } catch (e) {

            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}