import {getConnectPool, result} from "../db";
import {getCookie} from "cookies-next";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;
        const encShprId = getCookie('enc_sh', {req, res});

        try {
            let query = `SELECT fnDecrypt(?, ?) AS SHPR_ID`;
            const resultMap = {};

            const [shprIdRow] = await conn.query(query, [encShprId, process.env.ENC_KEY]);
            const shprId = shprIdRow[0].SHPR_ID;

            query = `
                INSERT INTO T_ODER_EXCP (
                    ODER_USER_ID, -- 주문사용자 ID
                    ODER_EXCP_KD, -- 주문 예외 종류(과적, 주차비)
                    ODER_EXCP_ATCH_FILE_UUID, -- 주문 예외 첨부파일 UUID
                    RGI_DT, -- 등록 일시
                    RGI_ID -- 등록 ID
                    ) VALUES (
                    ?,
                    ?,
                    ?,
                    NOW(),
                    ?
                )`;

            const [rows, fields] = await conn.query(query, [param.oderUserId, param.oderExcpKd, param.atchFileUuid, shprId]);

            res.status(200).json(result(rows));
        } catch (e) {

            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}