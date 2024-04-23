import cmm from "../../../js/common";
import iconv from "iconv-lite";
import {result} from "../db";
import {getCookie} from "cookies-next";

export default async function handler(req, res) {

    const encShprId = getCookie('enc_sh', {req, res});

    const param = req.body;
    const ORDERID = !!param.orderId ? encodeURIComponent(encShprId) : '';

    cmm.ajax({
        url: 'https://uas.teledit.com/uas/',
        isExtr: true,
        contextType: 'application/x-www-form-urlencoded; charset=utf-8',
        responseType: 'arraybuffer',
        data: {
            TXTYPE: encodeURI('ITEMSEND'),
            SERVICE: encodeURI('UAS'),
            AUTHTYPE: encodeURI('36'),
            CPID: encodeURI(process.env.NEXT_PUBLIC_API_DANAL_CPID),
            CPPWD: encodeURI(process.env.NEXT_PUBLIC_API_DANAL_CPPWD),
            TARGETURL: encodeURI(process.env.NEXT_PUBLIC_LOCAL_URL + '/api/join/callbackSelfCfm'),
            USERID: '',
            ORDERID
        },
        success: data => {

            res.status(200).json(result(cmm.util.queryStringToJSON(iconv.decode(data, 'utf-8').toString())));
        }
    });
}