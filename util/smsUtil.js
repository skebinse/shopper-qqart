
import {$cmm} from "../js/common";
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

        $cmm.ajax({
            url: 'https://apis.aligo.in/send/',
            data: {
                msg,
                receiver,
                user_id: 'justdoeng',
                key: 'pe1a6ws0h5z4f2zqj3ewm4xt3whqnto3',
                sender: '1855-0582',
                rdate: '',
                rtime: '',
                title: '[퀵퀵카트]',
            },
            success: res => {

                if(res.result_code === '1') {

                    !!callback && callback(true);
                } else {

                    !!callback && callback(false);
                }
            },
            error: res => {
                !!callback && callback(false);
            },
        });
    }
}
