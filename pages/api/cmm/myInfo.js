import {getConnectPool, result} from "../db";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        switch (req.method) {
            case 'GET':
                return getMyInfo(conn, req, res);
            case 'PUT':
                return setMyInfo(conn, req, res);
            case 'DELETE':
                return deleteSchedule(conn, req, res);
            case 'POST':
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
        const query = `
                SELECT SHPR_NCNM
                     , SHPR_NTFY_YN
                     , fnGetAtchFileList(SHPR_PRFL_ATCH_FILE_UUID) AS SHPR_PRFL_FILE
                     , fnGetShprPoint(SHPR_ID) AS SHPR_POIN
                  FROM T_SHPR_INFO
                 WHERE SHPR_ID = fnDecrypt(?, ?)
            `;

        const [rows] = await conn.query(query, [req.headers['x-enc-user-id'], process.env.ENC_KEY]);

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

    try {
        const query = `
                UPDATE T_SHPR_INFO
                   SET SHPR_NTFY_YN = ?
                     , SHPR_NTFY_AGR_YMD = NOW()
                 WHERE SHPR_ID = fnDecrypt(?, ?)
            `;

        const [rows] = await conn.query(query, [param.shprNtfyYn, req.headers['x-enc-user-id'], process.env.ENC_KEY]);

        res.status(200).json(result(rows[0]));
    } catch (e) {

        console.log(e);
        res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
    }
}