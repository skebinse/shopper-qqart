import {getConnectPool, result} from "../../db";
import {getCookie} from "cookies-next";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const {bbadId} = req.query;
        const encShprId = getCookie('enc_sh', {req, res});

        try {

            let query = `SELECT fnDecrypt(?, ?) AS SHPR_ID`;

            const [shprIdRow] = await conn.query(query, [encShprId, process.env.ENC_KEY]);
            const shprId = shprIdRow[0].SHPR_ID;

            query = 'UPDATE T_BBAD_MAG SET BBAD_INQCN = BBAD_INQCN + 1 WHERE BBAD_ID = ?';

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

            // TODO 슈퍼범블비 권한
            if(rows.length > 0 && rows[0].BBAD_KD === '이벤트' && (shprId == 1799 || shprId == 3448 || shprId == 281 || shprId == 2079)) {

                rows[0].invisible = true;
            }

            res.status(200).json(result(rows[0]));
        } catch (e) {

            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}