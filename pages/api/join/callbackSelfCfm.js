import {getConnectPool, result} from "../db";
import cmm from "../../../js/common";
import iconv from "iconv-lite";
import {getCookie} from "cookies-next";
import {setJoinSession} from "../../../util/joinSession";

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

            // 본인인증 실패 (확인 결과 없음) - 기존 정보를 NULL 로 덮어쓰지 않도록 중단
            if(!dataJson.NAME || !dataJson.IDEN || !dataJson.PHONE) {

                res.redirect(!!dataJson.ORDERID ? `/join/info` : `/join/essInfoInpt?error=9999`);
                return;
            }

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

                // 가입: 본인인증 결과는 서명 쿠키에만 보관 (URL/클라이언트로 개인정보 전달하지 않음)
                setJoinSession(req, res, {
                    name: dataJson.NAME,
                    iden: dataJson.IDEN,
                    cphoneNo: dataJson.PHONE,
                });

                res.redirect(`/join/essInfoInpt`);
            }
        },
        error: () => {

            res.redirect(`/join/essInfoInpt?error=9999`);
        }
    });

}