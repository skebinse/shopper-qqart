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
                SELECT CASE WHEN AA.SHPR_BANK_ACNO != '' THEN 'Y' ELSE 'N' END AS AC_INPT_YN
                     , fnGetShprPoint(SHPR_ID) AS SHPR_POIN
                     , (
                        SELECT DATE_FORMAT(A.COMM_YMD, '%m월 %d일') AS PY_DT
                          FROM (
                                SELECT A.CD_RMK2
                                     , B.COMM_YMD
                                     , ROW_NUMBER() OVER (ORDER BY B.COMM_YMD) AS NUM
                                  FROM (
                                        SELECT DATE_ADD(MIN(A.SHPR_ADJ_REQ_DT), INTERVAL 9 HOUR) AS STD_YMD
                                             , C.CD_RMK2
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
                                       ) A
                                       LEFT OUTER JOIN T_COMM_YMD_MAG B
                                    ON B.COMM_YMD > A.STD_YMD
                                   AND B.COMM_YMD_HLDY_YN = 'N'
                               ) A
                          WHERE NUM = A.CD_RMK2
                       ) AS PY_DT
                  FROM T_SHPR_INFO AA
                 WHERE AA.SHPR_ID = ?
                   AND AA.SHPR_SCSS_YN = 'N'
            `;

            const [rows] = await conn.query(query, [shprId, shprId]);

            res.status(200).json(resultOne(rows));
        } catch (e) {

            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}