import {getConnectPool, result, resultOne} from "../db";
import {getCookie} from "cookies-next";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;

        try {
            const encShprId = getCookie('enc_sh', {req, res});

            let query = `SELECT fnDecrypt(?, ?) AS SHPR_ID`;

            const [shprIdRow] = await conn.query(query, [encShprId, process.env.ENC_KEY]);
            const shprId = shprIdRow[0].SHPR_ID;

            query = `
               SELECT AA.*
                    , CASE 
                        WHEN DATE_FORMAT(SHPR_ADJ_REQ_DT, '%d') > 20 THEN DATE_FORMAT(LAST_DAY(DATE_ADD(SHPR_ADJ_REQ_DT, INTERVAL 1 MONTH)), '%m월 %d일')
                      ELSE DATE_FORMAT(LAST_DAY(SHPR_ADJ_REQ_DT), '%m월 %d일') END AS PY_DT
                 FROM (
                    SELECT BB.CD_RMK2
                         , CASE WHEN AA.SHPR_BANK_ACNO != '' THEN 'Y' ELSE 'N' END AS AC_INPT_YN
                         , REPLACE(fnGetShprPoint(AA.SHPR_ID) COLLATE utf8mb4_unicode_ci, ',', '') - (SELECT IFNULL(SUM(A.SHPR_ADJ_AMT), 0) 
                              FROM T_SHPR_ADJ_MAG A 
                             WHERE A.SHPR_ID = AA.SHPR_ID 
                               AND A.SHPR_ADJ_KD = 'POIN' 
                               AND A.SHPR_ADJ_APV_DT IS NULL) AS SHPR_POIN
                         , (SELECT DATE_ADD(MIN(A.SHPR_ADJ_REQ_DT), INTERVAL 9 HOUR) 
                              FROM T_SHPR_ADJ_MAG A 
                             WHERE A.SHPR_ID = AA.SHPR_ID 
                               AND A.SHPR_ADJ_KD = 'POIN' 
                               AND A.SHPR_ADJ_REQ_DT >= CONCAT(DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 9 HOUR), '%Y%m'), '01')
                               AND A.SHPR_ADJ_APV_DT IS NULL) AS SHPR_ADJ_REQ_DT
                      FROM T_SHPR_INFO AA
                           INNER JOIN T_CD_MAG BB
                        ON BB.CD_SPPO_ID = 158
                       AND BB.CD_RMK = AA.SHPR_GRD_CD
                     WHERE AA.SHPR_ID = ?
                   ) AA
            `;

            const [rows] = await conn.query(query, [shprId]);

            res.status(200).json(resultOne(rows));
        } catch (e) {

            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}