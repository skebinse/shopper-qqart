import {getConnectPool, result} from "../../db";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const {bbadId} = req.query;

        try {

            let query = 'UPDATE T_BBAD_MAG SET BBAD_INQCN = BBAD_INQCN + 1 WHERE BBAD_ID = ?';

            let [rows, fields] = await conn.query(query, [bbadId]);

            query = `
                SELECT BBAD_KD
                     , BBAD_TRGT
                     , BBAD_TITL
                     , BBAD_TEXT
                     , BBAD_BLLT_STRT_YMD
                     , BBAD_BLLT_END_YMD
                     , DATE_FORMAT(RGI_DT, '%Y-%m-%d') AS RGI_DT
                  FROM T_BBAD_MAG
                 WHERE BBAD_TRGT IN ('전체', '쇼퍼')
                   AND BBAD_EXPO_YN = 'Y'
                   AND BBAD_ID = ?
            `;

            [rows, fields] = await conn.query(query, [bbadId]);

            res.status(200).json(result(rows[0]));
        } catch (e) {

            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}