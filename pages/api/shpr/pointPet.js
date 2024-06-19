import {getConnectPool, result} from "../db";
import {getCookie} from "cookies-next";
import cmm from "../../../js/common";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;

        try {
            const encShprId = getCookie('enc_sh', {req, res});

            let query = `SELECT fnDecrypt(?, ?) AS SHPR_ID`;

            const [shprIdRow] = await conn.query(query, [encShprId, process.env.ENC_KEY]);
            const shprId = shprIdRow[0].SHPR_ID;

            query = `
                SELECT fnGetShprPoint(?) AS SHPR_POINT;
            `;

            let [rows] = await conn.query(query, [shprId]);

            // 백만P 이상일 경우
            if(cmm.util.getNumber(param.widPoint) > 1000000) {

                res.status(200).json(result('', '9999', `최대 1,000,000P 까지 출금 가능합니다.`));
            } else if(cmm.util.getNumber(param.widPoint) > cmm.util.getNumber(rows[0].SHPR_POINT)) {

                res.status(200).json(result('', '9999', `출금 가능 포인트는 최대 ${rows[0].SHPR_POINT}P 입니다.`));
            } else {

                query = `
                    INSERT INTO T_SHPR_ADJ_MAG(
                        SHPR_ID
                      , SHPR_ADJ_KD
                      , SHPR_ADJ_AMT
                      , SHPR_ADJ_REQ_DT
                    ) VALUES (
                        ?
                      , 'POIN'
                      , ?
                      , NOW()
                    );
                `;

                [rows] = await conn.query(query, [shprId, cmm.util.getNumber(param.widPoint)]);

                res.status(200).json(result(rows));
            }

        } catch (e) {

            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}