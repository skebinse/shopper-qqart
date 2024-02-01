import {getConnectPool, result} from "../db";
import {getCookie} from "cookies-next";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;

        try {
            const encShprId = getCookie('enc_sh', {req, res});

            let query = `SELECT fnDecrypt(?, ?) AS SHPR_ID`;

            const [shprIdRow] = await conn.query(query, [encShprId, process.env.ENC_KEY]);
            const shprId = shprIdRow[0].SHPR_ID;
            const rowCnt = !!param.rowCnt ? Number(param.rowCnt) : 10;

            if(param.tabIdx === '0') {

                query = `
                SELECT SQL_CALC_FOUND_ROWS AA.SHPR_POIN_ID
                     , AA.ODER_USER_ID
                     , AA.SHPR_POIN_RRV_AMT AS SHPR_POIN_AMT
                     , AA.SHPR_POIN_LDTN_KD
                     , DATE_FORMAT(DATE_ADD(AA.SHPR_POIN_YMD, INTERVAL 9 HOUR), '%Y년 %m월 %d일') AS SHPR_POIN_YMD
                     , IFNULL(BB.ADIX_ADJ_NM, IFNULL(AA.SHPR_POIN_RRV_RSN, '')) AS SHPR_POIN_RRV_RSN
                FROM T_SHPR_POIN AA
                     LEFT OUTER JOIN T_SHPR_ADIX_ADJ_MAG BB
                  ON BB.ADIX_ADJ_ID = AA.ADIX_ADJ_ID
                WHERE AA.SHPR_ID = ?
                  AND SHPR_POIN_DEL_YN = 'N'
             ORDER BY SHPR_POIN_YMD DESC
                LIMIT ? OFFSET ?
            `;
            } else {

                query = `
               SELECT SQL_CALC_FOUND_ROWS SHPR_POIN_HITY_ID
                    , ODER_USER_ID
                    , POIN_HITY_AMT AS SHPR_POIN_AMT
                    , POIN_USE_MNBO
                    , DATE_FORMAT(DATE_ADD(RGI_DT, INTERVAL 9 HOUR), '%Y년 %m월 %d일') AS SHPR_POIN_YMD
                    , IFNULL(POIN_USE_TEXT, '') AS SHPR_POIN_RRV_RSN
                 FROM T_SHPR_POIN_HITY
                WHERE SHPR_ID = ?
                  AND POIN_DEL_YN = 'N'
                  AND POIN_RRV_AND_USE = 'U'
             ORDER BY SHPR_POIN_YMD DESC
                LIMIT ? OFFSET ?
            `;
            }

            const [rows, fields] = await conn.query(query, [shprId, rowCnt, ((param.page - 1) * rowCnt)]);

            query = `SELECT FOUND_ROWS() AS CNT`;

            const [totalCntRow] = await conn.query(query, [encShprId, process.env.ENC_KEY]);
            const totalCnt = totalCntRow[0].CNT;

            res.status(200).json(result({list: rows, totalCnt}));
        } catch (e) {

            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}