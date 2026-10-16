import { getConnectPool, result } from "../db";
import {getAuthShprId} from "../../../util/authUtil";

export default async function handler(req, res) {
    await getConnectPool(async conn => {

        let shprId;

        if(['GET', 'PATCH', 'DELETE'].includes(req.method)) {

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
            case 'GET':
                return getSchedule(conn, req, res, shprId);
            case 'PATCH':
                return setSchedule(conn, req, res, shprId);
            case 'DELETE':
                return deleteSchedule(conn, req, res, shprId);
            case 'POST':
            default:
                res.status(500).json(result('', '9999', 'Method not supported'));
        }
    });
}

async function getSchedule(conn, req, res, shprId) {
    const { id } = req.query;

    try {
        const query = `
            SELECT SHPR_SCHD_ID,
                SHPR_ID,
                DATE_FORMAT(SHPR_SCHD_YMD, '%Y-%m-%d') AS SHPR_SCHD_YMD,
                SHPR_SCHD_AREA,
                SHPR_SCHD_HH,
                DATE_FORMAT(RGI_DT, '%Y-%m-%d') AS RGI_DT,
                RGI_ID,
                DATE_FORMAT(MDFC_DT, '%Y-%m-%d') AS MDFC_DT,
                MDFC_ID
            FROM T_SHPR_SCHD_MAG
            WHERE SHPR_SCHD_ID = ?
              AND SHPR_ID = ?
        `;

        const [rows] = await conn.query(query, [id, shprId]);
        res.status(200).json(result(rows[0]));
    } catch (e) {
        console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
        console.log(e);
        res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
    }
}

async function setSchedule(conn, req, res, shprId) {
    const { query: { id }, body: { area, schedule } } = req;

    try {
        const query =`
            UPDATE T_SHPR_SCHD_MAG
                SET SHPR_SCHD_AREA = ?,
                    SHPR_SCHD_HH = ?
              WHERE SHPR_SCHD_ID = ?
                AND SHPR_ID = ?
        `;

        await conn.query(query, [area, schedule, id, shprId]);
        res.status(200).json(result(id));
    } catch (e) {
        console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
        console.log(e);
        res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
    }
}

async function deleteSchedule(conn, req, res, shprId) {
    const { id } = req.query;

    try {
        const query =`
            DELETE FROM T_SHPR_SCHD_MAG
             WHERE SHPR_SCHD_YMD = ?
               AND SHPR_ID = ?
        `;

        await conn.query(query, [id, shprId]);
        res.status(200).json(result(id));
    } catch (e) {
        console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
        console.log(e);
        res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
    }
}
