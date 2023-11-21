import {getConnectPool, result} from "../../db";
import {adminSendNtfy} from "../../../../util/smsUtil";
import {getCookie} from "cookies-next";
import cmm from "../../../../js/common";

export default async function handler(req, res) {

    await getConnectPool(async conn => {

        const param = req.body;
        let queryParam = [];
        const encShprId = getCookie('enc_sh', {req, res});

        try {

            let query = `SELECT fnDecrypt(?, ?) AS SHPR_ID`;

            const [shprIdRow] = await conn.query(query, [encShprId, process.env.ENC_KEY]);
            const shprId = shprIdRow[0].SHPR_ID;

            query =`
                UPDATE T_ODER_USER_INFO
                   SET ODER_PGRS_STAT = ?
                     , ODER_SHPP_STRT_DT = NOW()
                 WHERE ODER_USER_ID = ?
                   AND SHPR_ID = ?
                   AND ODER_PGRS_STAT != '06'
                `;

            queryParam = [param.oderPgrsStat, param.oderUserId, shprId];

            // 배달중에서 배달 완료 시
            if(param.oderPgrsStat === '05') {
                query =`
                    UPDATE T_ODER_USER_INFO
                       SET ODER_PGRS_STAT = ?
                         , ODER_DELY_STRT_DT = NOW()
                         , ODER_PIUP_VCHR_ATCH_FILE_UUID = ?
                     WHERE ODER_USER_ID = ?
                       AND SHPR_ID = ?
                       AND ODER_PGRS_STAT != '06'
                    `;

                queryParam = [param.oderPgrsStat, param.atchFileUuid, param.oderUserId, shprId];
            }

            const [rows, fields] = await conn.query(query, queryParam);

            // 배달중에서 배달 완료 시
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