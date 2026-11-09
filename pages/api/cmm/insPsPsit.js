import {getConnectPool, result} from "../db";
import {getAuthShprId} from "../../../util/authUtil";
import {hasProxyCookie} from "../../../util/proxyUtil";

export default async function handler(req, res) {

    // 관리자 대행 중에는 위치를 저장하지 않음 (관리자 PC 위치가 쇼퍼 위치로 저장되는 것 방지)
    if((process.env.NEXT_PUBLIC_RUN_MODE === 'local' && process.env.DB_PROD_YN === 'Y') || hasProxyCookie(req, res)) {

        res.status(200).json(result(''));
        return;
    }

    await getConnectPool(async conn => {

        const param = req.body;

        try {

            // 비로그인 상태에서도 주기적으로 호출되므로 alert/이동 없이 저장만 생략
            const shprId = await getAuthShprId(conn, req, res, {checkTkn: false, respond: false});

            if(!shprId) {

                res.status(200).json(result(''));
                return;
            }

            const query = `
                INSERT INTO T_SHPR_PS_PSIT(
                     SHPR_ID
                   , SHPR_PSIT_LAT
                   , SHPR_PSIT_LOT
                   , SHPR_APP_YN
                   , SHPR_PSIT_RGI_YMD
                   , RGI_DT
                ) VALUES (
                     ?
                   , ?
                   , ?
                   , ?
                   , DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 9 HOUR), '%Y-%m-%d')
                   , NOW()
                )
            `;

            const [rows] = await conn.query(query, [shprId, param.lot, param.lat, param.shprAppYn]);

            res.status(200).json(result(rows));
        } catch (e) {

            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}