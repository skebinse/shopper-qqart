
import cmm from "../js/common";
/**
 SMS 발송
 * @param receiver
 * @param msg
 * @param callback
 */
export function smsSend(receiver, msg, callback) {

    if(process.env.NEXT_PUBLIC_RUN_MODE === 'local') {

        console.log(msg);
        callback(true);
    } else {

        cmm.ajax({
            url: 'https://apis.aligo.in/send/',
            isLoaing: false,
            isExtr: true,
            data: {
                msg,
                receiver,
                user_id: 'justdoeng',
                key: 'pe1a6ws0h5z4f2zqj3ewm4xt3whqnto3',
                sender: '1533-9171',
                rdate: '',
                rtime: '',
                title: '[퀵퀵카트]',
            },
            success: res => {

                if(res.result_code === '1') {

                    !!callback && callback(true);
                } else {

                    console.log(res)
                    !!callback && callback(false);
                }
            },
            error: res => {
                console.error('smsUtil', res);
                !!callback && callback(false);
            },
        });
    }
}

/**
 * admin 알림 발송
 * @param conn
 * @param options
 * @returns {Promise<void>}
 */
export async function adminSendNtfy(conn, options) {

    if(process.env.NEXT_PUBLIC_RUN_MODE === 'local1') {
        return;
    }

    const notification = {
        icon: '/static/images/snsImage.png',
        data: JSON.stringify({url: process.env.QQCART_URL + '/znlrzkxm/mag/order.qq'})
    };

    if(options.ntfyType === 'btchAcp') {

        const query =`
                SELECT SHOP_NM 
                     , SHPR_NCNM
                     , ODER_RPRE_NO
                  FROM T_ODER_USER_INFO AA
                       INNER JOIN T_SHPR_INFO BB 
                    ON BB.SHPR_ID = AA.SHPR_ID
                       INNER JOIN T_SHOP_MAG CC 
                    ON CC.SHOP_ID = AA.SHOP_ID
                 WHERE AA.ODER_USER_ID = ?
                `;

        const [rows] = await conn.query(query, [options.oderUserId]);

        if(!!rows[0]) {
            notification.title = '배치 수락';
            notification.body = `${rows[0].SHPR_NCNM}쇼퍼가 ${rows[0].SHOP_NM}${!!rows[0].ODER_RPRE_NO ? ' 접수번호 : ' + rows[0].ODER_RPRE_NO : ''} 수락하였습니다`;
        }
    } else if(options.ntfyType === 'delyStrt') {

        const query =`
                SELECT SHOP_NM 
                     , SHPR_NCNM
                     , ODER_RPRE_NO
                  FROM T_ODER_USER_INFO AA
                       INNER JOIN T_SHPR_INFO BB 
                    ON BB.SHPR_ID = AA.SHPR_ID
                       INNER JOIN T_SHOP_MAG CC 
                    ON CC.SHOP_ID = AA.SHOP_ID
                 WHERE AA.ODER_USER_ID = ?
                `;

        const [rows] = await conn.query(query, [options.oderUserId]);

        if(!!rows[0]) {
            notification.title = '배달 시작';
            notification.body = `${rows[0].SHPR_NCNM}쇼퍼가 ${rows[0].SHOP_NM}${!!rows[0].ODER_RPRE_NO ? ' 접수번호 : ' + rows[0].ODER_RPRE_NO : ''} 배달을 시작하였습니다.`;
        }
    } else if(options.ntfyType === 'delyCpl') {

        const query =`
                SELECT SHOP_NM 
                     , SHPR_NCNM
                     , ODER_RPRE_NO
                  FROM T_ODER_USER_INFO AA
                       INNER JOIN T_SHPR_INFO BB 
                    ON BB.SHPR_ID = AA.SHPR_ID
                       INNER JOIN T_SHOP_MAG CC 
                    ON CC.SHOP_ID = AA.SHOP_ID
                 WHERE AA.ODER_USER_ID = ?
                `;

        const [rows] = await conn.query(query, [options.oderUserId]);

        if(!!rows[0]) {
            notification.title = '배달 완료';
            notification.body = `${rows[0].SHPR_NCNM}쇼퍼가 ${rows[0].SHOP_NM}${!!rows[0].ODER_RPRE_NO ? ' 접수번호 : ' + rows[0].ODER_RPRE_NO : ''} 배달을 완료하였습니다.`;
        }
    } else if(options.ntfyType === 'btchCan') {

        const query =`
                SELECT SHOP_NM 
                     , SHPR_NCNM
                     , ODER_RPRE_NO
                  FROM T_ODER_USER_INFO AA
                       INNER JOIN T_SHPR_INFO BB 
                    ON BB.SHPR_ID = fnDecrypt(?, ?)
                       INNER JOIN T_SHOP_MAG CC 
                    ON CC.SHOP_ID = AA.SHOP_ID
                 WHERE AA.ODER_USER_ID = ?
                `;

        const [rows] = await conn.query(query, [options.encUserId, options.encKey, options.oderUserId]);
        if(!!rows[0]) {
            notification.title = '배치 취소';
            notification.body = `${rows[0].SHPR_NCNM}쇼퍼가 ${rows[0].SHOP_NM}${!!rows[0].ODER_RPRE_NO ? ' 접수번호 : ' + rows[0].ODER_RPRE_NO : ''} 수락을 취소하였습니다.`;
        }
    }

    if(!!notification.body) {

        fetch('https://fcm.googleapis.com/fcm/send', {
            'method': 'POST',
            'headers': {
                'Authorization': 'key=' + process.env.NEXT_PUBLIC_FCM_KEY,
                'Content-Type': 'application/json'
            },
            'body': JSON.stringify({
                'notification': notification,
                'to': `/topics/${process.env.NEXT_PUBLIC_RUN_MODE === 'prod' ? '' : process.env.NEXT_PUBLIC_RUN_MODE}admin`
            })
        }).then(function(response) {

        }).catch(function(error) {
            console.error('error :' + error);
        });
    }
}