import {getConnectPool, result} from "../db";
import {getCookie} from "cookies-next";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        switch (req.method) {
            case 'GET':
                return getMyInfo(conn, req, res);
            case 'PUT':
                return setMyInfo(conn, req, res);
            default:
                res.status(500).json(result('', '9999', 'Method not supported'));
        }
    });
}

/**
 * MyInfo 정보 조회
 * @param conn
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
async function getMyInfo(conn, req, res) {

    try {
        const encShprId = getCookie('enc_sh', {req, res});

        let query = `SELECT fnDecrypt(?, ?) AS SHPR_ID`;

        const [shprIdRow] = await conn.query(query, [encShprId, process.env.ENC_KEY]);
        const shprId = shprIdRow[0].SHPR_ID;
        
        query = `
                SELECT AA.SHPR_CRCTNO
                     , AA.SHPR_GRD_CD
                     , AA.SHPR_LOGIN_ID
                     , AA.SHPR_SNS_TYPE
                     , AA.SHPR_NCNM
                     , AA.SHPR_PRFL_ATCH_FILE_UUID
                     , AA.SHPR_STDO_CD
                     , AA.SHPR_ZIPC
                     , AA.SHPR_ADDR
                     , AA.SHPR_DTPT_ADDR
                     , AA.SHPR_ADDR_LAT
                     , AA.SHPR_ADDR_LOT
                     , AA.SHPR_TNAL_PRFL
                     , AA.SHPR_SNS_TYPE
                     , AA.SHPR_SFITD_TEXT
                     , AA.SHPR_SCSS_YN
                     , AA.SHPR_SCSS_YMD
                     , AA.SHPR_DELY_POS_DTC
                     , AA.SHPR_NCNM
                     , AA.SHPR_NTFY_YN
                     , AA.SHPR_VHCL_KD
                     , AA.SHPR_VHCL_NM
                     , AA.SHPR_VHCL_NO
                     , AA.SHPR_BANK_NM
                     , AA.SHPR_BRDT
                     , AA.SHPR_NAME
                     , BB.CD_NM AS SHPR_GRD_NM
                     , CASE WHEN LENGTH(IFNULL(AA.SHPR_BANK_ACNO, '') > 4) THEN CONCAT(REPEAT('*', CHAR_LENGTH(AA.SHPR_BANK_ACNO) - 4), RIGHT(AA.SHPR_BANK_ACNO, 4)) ELSE AA.SHPR_BANK_ACNO END AS SHPR_BANK_ACNO
                     , fnGetAtchFileList(AA.SHPR_PRFL_ATCH_FILE_UUID) AS SHPR_PRFL_FILE
                     , fnGetShprPoint(AA.SHPR_ID) AS SHPR_POIN
                     , fnGetHoneyMone(AA.SHPR_ID) AS SHPR_HONEY_MONE
                  FROM T_SHPR_INFO AA
                       LEFT OUTER JOIN T_CD_MAG BB
                    ON BB.CD_SPPO_ID = 158
                   AND BB.CD_RMK = AA.SHPR_GRD_CD
                 WHERE AA.SHPR_ID = ?
                   AND AA.SHPR_SCSS_YN = 'N'
            `;

        const [rows] = await conn.query(query, [shprId]);

        res.status(200).json(result(rows[0]));
    } catch (e) {

        console.log(e);
        res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
    }
}

/**
 * MyInfo 수정
 * @param conn
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
async function setMyInfo(conn, req, res) {

    const param = req.body;
    const encShprId = getCookie('enc_sh', {req, res});

    try {

        let query = `SELECT fnDecrypt(?, ?) AS SHPR_ID`;

        const [shprIdRow] = await conn.query(query, [encShprId, process.env.ENC_KEY]);
        const shprId = shprIdRow[0].SHPR_ID;

        query = `
                UPDATE T_SHPR_INFO
                   SET SHPR_NTFY_YN = ?
                     , SHPR_NTFY_AGR_YMD = NOW()
                 WHERE SHPR_ID = ?
                   AND SHPR_SCSS_YN = 'N'
            `;

        const [rows] = await conn.query(query, [param.shprNtfyYn, shprId]);

        res.status(200).json(result(rows[0]));
    } catch (e) {

        console.log(e);
        res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
    }
}