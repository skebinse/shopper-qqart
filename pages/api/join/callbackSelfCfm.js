import {getConnectPool, result} from "../db";
import cmm from "../../../js/common";
import iconv from "iconv-lite";
import bcrypt from 'bcrypt';

export default async function handler(req, res) {

    cmm.ajax({
        url: 'https://uas.teledit.com/uas/',
        isExtr: true,
        contextType: 'application/x-www-form-urlencoded; charset=utf-8',
        responseType: 'arraybuffer',
        data: {
            TXTYPE: 'CONFIRM',
            TID: req.body.TID,
            CONFIRMOPTION: '0',
            IDENOPTION: '0',
        },
        success: async data => {

            const dataJson = cmm.util.queryStringToJSON(iconv.decode(data, 'utf-8').toString());

            res.redirect(`/join/essInfoInpt?name=${encodeURI(dataJson.NAME)}&nameHash=${encodeURI(await bcrypt.hash(dataJson.NAME, 10))}&iden=${dataJson.IDEN}&phone=${dataJson.PHONE}`);
        },
        error: () => {

            res.redirect(`/join/essInfoInpt?error=9999`);
        }
    });

}