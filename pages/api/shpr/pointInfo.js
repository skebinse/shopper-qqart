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
                            WHEN DATE_FORMAT(SHPR_ADJ_REQ_DT, '%d') > 20 THEN DATE_FORMAT(DATE_ADD(SHPR_ADJ_REQ_DT, INTERVAL 1 MONTH), '%m월 01일')
                          ELSE DATE_FORMAT(LAST_DAY(SHPR_ADJ_REQ_DT), '%m월 %d일') END AS PY_DT
                     FROM (
                       SELECT DATE_ADD(MIN(A.SHPR_ADJ_REQ_DT), INTERVAL 9 HOUR) AS SHPR_ADJ_REQ_DT
                            , C.CD_RMK2
                            , CASE WHEN B.SHPR_BANK_ACNO != '' THEN 'Y' ELSE 'N' END AS AC_INPT_YN
                            , fnGetShprPoint(A.SHPR_ID) AS SHPR_POIN
                         FROM T_SHPR_ADJ_MAG A
                              INNER JOIN T_SHPR_INFO B
                           ON B.SHPR_ID = A.SHPR_ID
                              INNER JOIN T_CD_MAG C
                           ON C.CD_SPPO_ID = 158
                          AND C.CD_RMK = B.SHPR_GRD_CD
                        WHERE A.SHPR_ID = ?
                          AND A.SHPR_ADJ_KD = 'POIN' 
                          AND A.SHPR_ADJ_APV_DT IS NULL
                     GROUP BY C.CD_RMK2
                            , B.SHPR_BANK_ACNO
                            , A.SHPR_ID
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