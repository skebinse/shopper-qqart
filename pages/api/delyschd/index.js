import { getConnectPool, result } from "../db";
import {getAuthShprId} from "../../../util/authUtil";

export default async function handler(req, res) {
    await getConnectPool(async conn => {

        let shprId;

        if(['POST', 'GET'].includes(req.method)) {

            try {

                shprId = await getAuthShprId(conn, req, res);
            } catch (e) {

                console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
                console.log(e);
                res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
                return;
            }

            if(!shprId) {

                return;
            }
        }

        switch (req.method) {
            case 'POST':
                return setSchedule(conn, req, res, shprId);
            case 'GET':
                return getSchedules(conn, req, res, shprId);
            case 'PATCH':
            case 'DELETE':
            default:
                res.status(500).json(result('', '9999', 'Method not supported'));
        }
    });
}

async function setSchedule(conn, req, res, shprId) {
    const { date, area, schedule } = req.body;

    try {

        let query, rows;
        // area 는 선택한 스토어 ID(SHOP_ID) 목록을 콤마로 연결한 문자열, 스토어 단위로 1행씩 등록
        for (const shopId of area.split(',')) {

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
                        ?,
                        DATE_FORMAT(?, '%Y-%m-%d'),
                        ?,
                        ?,
                        NOW(),
                        NULL,
                        NOW(),
                        NULL
                )
            `;

            [rows] = await conn.query(query, [shprId, date, shopId, schedule]);
        }

        res.status(200).json(result(rows.insertId));
    } catch (e) {
        console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
        console.log(e);
        res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
    }
}

async function getSchedules(conn, req, res, shprId) {
    const { startdate, enddate } = req.query;

    try {
        const query = `
             SELECT DATE_FORMAT(SHPR_SCHD_YMD, '%Y-%m-%d') AS SHPR_SCHD_YMD,
                    GROUP_CONCAT(SHPR_SCHD_AREA) AS SHPR_SCHD_AREA,
                    SHPR_SCHD_HH,
                    SHPR_SCHD_APV_STAT
               FROM T_SHPR_SCHD_MAG
              WHERE SHPR_ID = ?
                AND SHPR_SCHD_YMD IS NOT NULL
                AND SHPR_SCHD_YMD BETWEEN ? AND ?
           GROUP BY SHPR_SCHD_YMD,
                    SHPR_SCHD_HH,
                    SHPR_SCHD_APV_STAT
        `;

        const [rows] = await conn.query(query, [shprId, startdate, enddate]);
        res.status(200).json(result(rows));
    } catch (e) {
        console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
        console.log(e);
        res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
    }
}
