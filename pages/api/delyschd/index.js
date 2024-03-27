import { getConnectPool, result } from "../db";
import {getCookie} from "cookies-next";

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
    const encShprId = getCookie('enc_sh', {req, res});

    try {

        let query, rows;
        for (const areaTxt of area.split(',')) {

            query =`
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

            [rows] = await conn.query(query, [encShprId, process.env.ENC_KEY, date, areaTxt, schedule]);
        }

        res.status(200).json(result(rows.insertId));
    } catch (e) {
        console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
        console.log(e);
        res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
    }
}

async function getSchedules(conn, req, res) {
    const { startdate, enddate } = req.query;
    const encShprId = getCookie('enc_sh', {req, res});

    try {
        const query = `
             SELECT DATE_FORMAT(SHPR_SCHD_YMD, '%Y-%m-%d') AS SHPR_SCHD_YMD,
                    GROUP_CONCAT(SHPR_SCHD_AREA) AS SHPR_SCHD_AREA,
                    SHPR_SCHD_HH,
                    SHPR_SCHD_APV_STAT
               FROM T_SHPR_SCHD_MAG
              WHERE SHPR_ID = fnDecrypt(?, ?)
                AND SHPR_SCHD_YMD IS NOT NULL
                AND SHPR_SCHD_YMD BETWEEN ? AND ?
           GROUP BY SHPR_SCHD_YMD,
                    SHPR_SCHD_HH,
                    SHPR_SCHD_APV_STAT
        `;

        const [rows] = await conn.query(query, [encShprId, process.env.ENC_KEY, startdate, enddate]);
        res.status(200).json(result(rows));
    } catch (e) {
        console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
        console.log(e);
        res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
    }
}
