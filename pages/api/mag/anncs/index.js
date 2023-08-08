import {getConnectPool, result} from "../../db";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;

        try {
            const query = `
                SELECT BBAD_ID
                     , BBAD_KD
                     , BBAD_TRGT
                     , BBAD_TITL
                     , BBAD_BLLT_STRT_YMD
                     , BBAD_BLLT_END_YMD
                     , DATE_FORMAT(RGI_DT, '%Y-%m-%d') AS RGI_DT
                  FROM T_BBAD_MAG
                 WHERE BBAD_TRGT IN ('전체', '쇼퍼')
                   AND BBAD_EXPO_YN = 'Y'
                   AND BBAD_KD = ?
              ORDER BY BBAD_SEQ
                     , RGI_DT DESC
            `;

            const [rows, fields] = await conn.query(query, [param.bbadKd]);

            res.status(200).json(result(rows));
        } catch (e) {

            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}