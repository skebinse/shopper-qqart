import {getConnectPool, result} from "../db";
import {accountCheckService } from "../../../js/popbill"
import bcrypt from 'bcrypt';
import {getCookie} from "cookies-next";

export default async function handler(req, res) {

    const param = req.body;

    if(process.env.NEXT_PUBLIC_RUN_MODE === 'local') {

        res.status(200).json(result(true));
    } else {

        // 개인정보 수저에서 접근
        if(!param.iden) {

            await getConnectPool(async conn => {

                const encShprId = getCookie('enc_sh', {req, res});

                let query = `SELECT fnDecrypt(?, ?) AS SHPR_ID`;

                const [shprIdRow] = await conn.query(query, [encShprId, process.env.ENC_KEY]);
                const shprId = shprIdRow[0].SHPR_ID;

                query =`
                    SELECT SHPR_BRDT
                         , SHPR_NAME
                      FROM T_SHPR_INFO
                     WHERE SHPR_ID = ?
                       AND SHPR_SCSS_YN = 'N'
                `;
                const [rows] = await conn.query(query, [shprId]);
                console.log(shprId, rows[0])
                if(!!rows[0].SHPR_BRDT) {

                    accountCheckService().checkDepositorInfo('6648802585', param.bankCd, param.bankNum, 'P', rows[0].SHPR_BRDT.substring(0, 6), 'VERYBUSYBEE', async resultRes => {

                        if(resultRes.result === 100) {

                            if(resultRes.accountName === rows[0].SHPR_NAME) {

                                res.status(200).json(result(true));
                            } else {

                                res.status(200).json(result('', '9999', '예금주명이 상이합니다.'));
                            }
                        } else {

                            res.status(200).json(result('', '9999', '은행 및 통장번호를 확인해 주세요.\n[' + resultRes.resultMessage + ']'));
                        }
                    }, resultRes => {

                        res.status(200).json(result(resultRes, '9999', `오류가 발생했습니다.\n[${resultRes?.message}]`));
                    });
                } else {

                    res.status(200).json(result(resultRes, '9999', `보인확인이 안된 계정입니다.`));
                }
            });
        } else {

            accountCheckService().checkDepositorInfo('6648802585', param.bankCd, param.bankNum, 'P', param.iden.substring(0, 6), 'VERYBUSYBEE', async resultRes => {

                if(resultRes.result === 100) {

                    if(await bcrypt.compare(resultRes.accountName, param.nameHash)) {

                        res.status(200).json(result(true));
                    } else {

                        res.status(200).json(result('', '9999', '예금주명이 상이합니다.'));
                    }
                } else {

                    res.status(200).json(result('', '9999', '은행 및 통장번호를 확인해 주세요.\n[' + resultRes.resultMessage + ']'));
                }
            }, resultRes => {

                res.status(200).json(result(resultRes, '9999', `오류가 발생했습니다.\n[${resultRes?.message}]`));
            });
        }
    }
}