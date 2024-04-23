import {getConnectPool, result} from "../db";
import cmm from "../../../js/common";
import iconv from "iconv-lite";
import bcrypt from 'bcrypt';
import {getCookie} from "cookies-next";

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

            if(!!dataJson.ORDERID) {

                await getConnectPool(async conn => {

                    try {

                        let query = `SELECT fnDecrypt(?, ?) AS SHPR_ID`;

                        const [shprIdRow] = await conn.query(query, [dataJson.ORDERID, process.env.ENC_KEY]);
                        const shprId = shprIdRow[0].SHPR_ID;

                        query = `
                            UPDATE T_SHPR_INFO
                               SET SHPR_NAME = ?
                                 , SHPR_BRDT = ?
                                 , SHPR_CPHONE_NO = ?
                                 , SHPR_SELF_AHRZ_DT = NOW()
                             WHERE SHPR_ID = ?
                        `;

                        await conn.query(query, [dataJson.NAME, dataJson.IDEN, dataJson.PHONE, shprId]);

                        res.redirect(`/join/info`);
                        // res.status(200).json(result(rows));
                    } catch (e) {

                        console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
                        console.log(e);
                        res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
                    }
                });

            } else {

                res.redirect(`/join/essInfoInpt?name=${encodeURI(dataJson.NAME)}&nameHash=${encodeURI(await bcrypt.hash(dataJson.NAME, 10))}&iden=${dataJson.IDEN}&cphoneNo=${dataJson.PHONE}`);
            }
        },
        error: () => {

            res.redirect(`/join/essInfoInpt?error=9999`);
        }
    });

}