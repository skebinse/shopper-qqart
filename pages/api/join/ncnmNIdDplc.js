import {getConnectPool, result} from "../db";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;

        try {
            let [rows] = await conn.query(`
                SELECT COUNT(*) AS CNT
                 FROM T_SHPR_INFO
                WHERE SHPR_SCSS_YN = 'N'
                  AND SHPR_NCNM = ?
            `, [param.userNcnm]);

            if(rows[0].CNT === 1) {

                res.status(500).json(result('', '9999', '동일한 별명이 있습니다.'));
            } else {

                let [rows] = await conn.query(`
                    SELECT COUNT(*) AS CNT
                     FROM T_SHPR_INFO
                    WHERE SHPR_LOGIN_ID = ?
                `, [param.userId]);

                if(rows[0].CNT === 1) {

                    res.status(500).json(result('', '9999', '동일한 아이디가 있습니다.'));
                } else {

                    res.status(200).json(result(rows[0]));
                }
            }
        } catch (e) {
            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium' } ).format(new Date()));
            console.log(e)
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}