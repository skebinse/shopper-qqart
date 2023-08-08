import {getConnectPool, result} from "../db";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;

        try {

            const query = `
                SELECT CD_ID
                     , CD_SPPO_ID
                     , CD_NM
                     , CD_RMK
                  FROM T_CD_MAG
                 WHERE CD_SPPO_ID = ?
            `;

            const [rows, fields] = await conn.query(query, [param.cdSppoId]);

            res.status(200).json(result(rows));
        } catch (e) {

            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}