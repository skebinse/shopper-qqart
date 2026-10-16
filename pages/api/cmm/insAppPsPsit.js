import {getConnectPool, result} from "../db";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body ?? {};

        // 네이티브 앱 백그라운드 호출이라 쿠키 인증은 하지 않고 입력값만 검증 (2026-10-04)
        // 컬럼명이 실제와 반대: lot(경도) → SHPR_PSIT_LAT, lat(위도) → SHPR_PSIT_LOT
        const lot = Number(param.lot);
        const lat = Number(param.lat);

        if(!/^\d+$/.test(String(param.shprId ?? '')) || !(lot >= 124 && lot <= 132) || !(lat >= 33 && lat <= 39)) {

            res.status(200).json(result('', '9999', '잘못된 요청입니다.'));
            return;
        }

        try {
            // 존재하고 탈퇴하지 않은 쇼퍼만 저장
            const query = `
                INSERT INTO T_SHPR_PS_PSIT(
                     SHPR_ID
                   , SHPR_PSIT_LAT
                   , SHPR_PSIT_LOT
                   , SHPR_APP_YN
                   , SHPR_PSIT_RGI_YMD
                   , RGI_DT
                )
                SELECT SHPR_ID
                     , ?
                     , ?
                     , 'Y'
                     , DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 9 HOUR), '%Y-%m-%d')
                     , NOW()
                  FROM T_SHPR_INFO
                 WHERE SHPR_ID = ?
                   AND SHPR_SCSS_YN = 'N'
            `;

            const [rows] = await conn.query(query, [param.lot, param.lat, param.shprId]);

            if(rows.affectedRows === 0) {

                res.status(200).json(result('', '9999', '잘못된 요청입니다.'));
                return;
            }

            res.status(200).json(result(rows));
        } catch (e) {

            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}