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
                SELECT SHPR_CRCTNO
                     , SHPR_GRD_CD
                     , SHPR_LOGIN_ID
                     , SHPR_SNS_TYPE
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
                     , SHPR_DELY_POS_DTC
                     , SHPR_NCNM
                     , SHPR_NTFY_YN
                     , SHPR_VHCL_KD
                     , SHPR_VHCL_NM
                     , SHPR_VHCL_NO
                     , SHPR_BANK_NM
                     , SHPR_BRDT
                     , SHPR_NAME
                     , CASE WHEN LENGTH(IFNULL(SHPR_BANK_ACNO, '') > 4) THEN CONCAT(REPEAT('*', CHAR_LENGTH(SHPR_BANK_ACNO) - 4), RIGHT(SHPR_BANK_ACNO, 4)) ELSE SHPR_BANK_ACNO END AS SHPR_BANK_ACNO
                     , fnGetAtchFileList(SHPR_PRFL_ATCH_FILE_UUID) AS SHPR_PRFL_FILE
                     , fnGetShprPoint(SHPR_ID) AS SHPR_POIN
                     , fnGetHoneyMone(SHPR_ID) AS SHPR_HONEY_MONE
                  FROM T_SHPR_INFO
                 WHERE SHPR_ID = ?
                   AND SHPR_SCSS_YN = 'N'
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