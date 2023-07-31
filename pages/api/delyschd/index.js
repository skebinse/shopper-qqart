import { getConnectPool, result } from "../db";

export default async function handler(req, res) {
    await getConnectPool(async conn => {
        switch (req.method) {
            case 'POST':
                return setSchedule(conn, req, res);
            case 'GET':
                return getSchedules(conn, req, res);
            case 'PATCH':
            case 'DELETE':
            default:
                res.status(500).json(result('', '9999', 'Method not supported'));
        }
    });
}

async function setSchedule(conn, req, res) {
    const { date, area, schedule } = req.body;

    try {
        const query =`
            INSERT INTO T_SHPR_SCHD_MAG (
                    SHPR_ID,
                    SHPR_SCHD_YMD,
                    SHPR_SCHD_AREA,
                    SHPR_SCHD_HH,
                    RGI_DT,
                    RGI_ID,
                    MDFC_DT,
                    MDFC_ID
            ) VALUES (
                    fnDecrypt(?, ?),
                    DATE_FORMAT(?, '%Y-%m-%d'),
                    ?,
                    ?,
                    NOW(),
                    NULL,
                    NOW(),
                    NULL
            )
        `;

        const [rows] = await conn.query(query, [req.headers['x-enc-user-id'], process.env.ENC_KEY, date, area, schedule]);
        res.status(200).json(result(rows.insertId));
    } catch (e) {
        console.log(e);
        res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
    }
}

async function getSchedules(conn, req, res) {
    const { startdate, enddate } = req.query;

    try {
        const query = `
            SELECT SHPR_SCHD_ID,
                    SHPR_ID,
                    SHPR_SCHD_YMD,
                    SHPR_SCHD_AREA,
                    SHPR_SCHD_HH,
                    DATE_FORMAT(RGI_DT, '%Y-%m-%d') AS RGI_DT,
                    RGI_ID,
                    DATE_FORMAT(MDFC_DT, '%Y-%m-%d') AS MDFC_DT,
                    MDFC_ID
                FROM T_SHPR_SCHD_MAG
                WHERE SHPR_ID = fnDecrypt(?, ?)
                AND SHPR_SCHD_YMD IS NOT NULL
                AND SHPR_SCHD_YMD BETWEEN CONCAT(DATE_FORMAT(?, '%Y-%m-%d'), ' 00:00:00') AND CONCAT(DATE_FORMAT(?, '%Y-%m-%d'), ' 23:59:59')
        `;

        const [rows] = await conn.query(query, [req.headers['x-enc-user-id'], process.env.ENC_KEY, startdate, enddate]);
        res.status(200).json(result(rows));
    } catch (e) {
        console.log(e);
        res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
    }
}
