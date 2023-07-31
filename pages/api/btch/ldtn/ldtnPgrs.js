import {getConnectPool, result} from "../../db";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;

        try {
            const query = `
                UPDATE T_ODER_USER_INFO
                   SET ODER_CARD_DRC_LDTN_CPL_YN = 'Y'
                 WHERE ODER_USER_ID = ?
            `;

            const [rows, fields] = await conn.query(query, [param.oderUserId]);

            res.status(200).json(result(rows));
        } catch (e) {

            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}