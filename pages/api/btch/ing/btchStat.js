import {getConnectPool, result} from "../../db";
import {adminSendNtfy} from "../../../../util/smsUtil";
import {getAuthShprId} from "../../../../util/authUtil";
import cmm from "../../../../js/common";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;
        let queryParam = [];

        try {

            const shprId = await getAuthShprId(conn, req, res);

            if(!shprId) {

                return;
            }

            // 허용 상태 전이만 처리 (ODER_PGRS_STAT 코드 체계는 그대로 사용)
            //   03 → 04 : 장보기 시작 (장보기 주문만)
            //   03/04 → 05 : 배달 시작
            if(param.oderPgrsStat !== '04' && param.oderPgrsStat !== '05') {

                res.status(200).json(result('', '9999', '잘못된 요청입니다.'));
                return;
            }

            let query =`
                UPDATE T_ODER_USER_INFO
                   SET ODER_PGRS_STAT = '04'
                     , ODER_SHPP_STRT_DT = NOW()
                 WHERE ODER_USER_ID = ?
                   AND SHPR_ID = ?
                   AND ODER_PGRS_STAT = '03'
                   AND ODER_KD = 'DELY'
                `;

            queryParam = [param.oderUserId, shprId];

            // 배달 시작
            if(param.oderPgrsStat === '05') {
                query =`
                    UPDATE T_ODER_USER_INFO
                       SET ODER_PGRS_STAT = '05'
                         , ODER_DELY_STRT_DT = NOW()
                         , ODER_PIUP_VCHR_ATCH_FILE_UUID = ?
                     WHERE ODER_USER_ID = ?
                       AND SHPR_ID = ?
                       AND ODER_PGRS_STAT IN ('03', '04')
                    `;

                queryParam = [param.atchFileUuid, param.oderUserId, shprId];
            }

            const [rows, fields] = await conn.query(query, queryParam);

            if(rows.affectedRows === 0) {

                res.status(200).json(result('', '9999', '이미 처리되었거나 변경할 수 없는 상태입니다.'));
                return;
            }

            // 배달 시작 시
            if(param.oderPgrsStat === '05') {

                // 고객에게 알림 전송(기존 배치 수락시 발송을 배달 시작 시로 변경)
                cmm.ajax({
                    url: process.env.QQCART_URL + `/sendSmsNtfy.ax`,
                    isLoaing: false,
                    isExtr: true,
                    data: {
                        pgrsStat: 'btch',
                        oderUserId: param.oderUserId,
                    },
                });
                // admin 알림 발송
                adminSendNtfy(conn, {ntfyType: 'delyStrt', oderUserId: param.oderUserId});
            }

            res.status(200).json(result(rows));
        } catch (e) {

            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}
