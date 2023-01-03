import {getConnectPool, result} from "../db";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        try {
            const query =`
                SELECT SHPR_CRCTNO
                     , SHPR_NCNM
                     , SHPR_PRFL_ATCH_FILE_UUID
                     , SHPR_STDO_CD
                     , SHPR_ZIPC
                     , SHPR_ADDR
                     , SHPR_DTPT_ADDR
                     , SHPR_ADDR_LAT
                     , SHPR_ADDR_LOT
                     , SHPR_TNAL_PRFL
                     , SHPR_SNS_TYPE
                     , SHPR_SFITD_TEXT
                     , SHPR_SCSS_YN
                     , SHPR_SCSS_YMD
                  FROM T_SHPR_INFO
                 WHERE SHPR_ID = fnDecrypt(?, ?)
                   AND SHPR_SCSS_YN = 'N'
            `;
            const [rows, fields, a,b] = await conn.query(query, [req.headers['x-enc-user-id'], process.env.ENC_KEY]);

            res.status(200).json(result(rows[0]));
        } catch (e) {
            console.log(e)
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}