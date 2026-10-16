import {getConnectPool, result} from "../db";
import {accountCheckService } from "../../../js/popbill"
import {setCookie} from "cookies-next";
import {getJoinSession, setJoinSession} from "../../../util/joinSession";
import {getAuthShprId} from "../../../util/authUtil";
import {signToken} from "../../../util/securityUtil";
import {getBankNm} from "../../../js/bankList";

export default async function handler(req, res) {

    const param = req.body;

    // 은행명은 확인한 은행코드 기준으로 서버에서 결정
    const bankNm = getBankNm(param.bankCd);

    if(!bankNm || !param.bankNum) {

        res.status(200).json(result('', '9999', '은행 및 통장번호를 확인해 주세요.'));
        return;
    }

    // 가입 중 계좌 확인: 본인인증 결과(서명 쿠키)의 이름/생년월일로만 확인하고, 확인된 계좌를 서명 쿠키에 보관
    if(param.joinYn === 'Y') {

        const session = getJoinSession(req, res);

        if(!session?.name) {

            res.status(200).json(result('', '9999', '본인인증 정보가 만료되었습니다.\n본인인증을 다시 진행해 주세요.'));
            return;
        }

        const saveBank = () => {

            setJoinSession(req, res, {
                ...session,
                bankCd: param.bankCd,
                bankNm,
                bankNum: param.bankNum,
                bankVrfd: true,
            });

            res.status(200).json(result(true));
        };

        if(process.env.NEXT_PUBLIC_RUN_MODE === 'local') {

            saveBank();
            return;
        }

        await new Promise(resolve => {

            accountCheckService().checkDepositorInfo('6648802585', param.bankCd, param.bankNum, 'P', String(session.iden).substring(0, 6), 'VERYBUSYBEE', resultRes => {

                if(resultRes.result === 100) {

                    if(resultRes.accountName === session.name) {

                        saveBank();
                    } else {

                        res.status(200).json(result('', '9999', '예금주명이 상이합니다.'));
                    }
                } else {

                    res.status(200).json(result('', '9999', '은행 및 통장번호를 확인해 주세요.\n[' + resultRes.resultMessage + ']'));
                }
                resolve();
            }, resultRes => {

                res.status(200).json(result('', '9999', `오류가 발생했습니다.\n[${resultRes?.message}]`));
                resolve();
            });
        });

        return;
    }

    // 개인정보 수정에서 접근: 확인에 성공하면 계좌 변경(/api/shpr/modBank)에 쓸 확인 쿠키 발급 (5분)
    await getConnectPool(async conn => {

        try {

            const shprId = await getAuthShprId(conn, req, res);

            if(!shprId) {

                return;
            }

            const saveBankVrf = () => {

                setCookie('bank_vrf', signToken('bankVrf', {shprId, bankCd: param.bankCd, bankNum: param.bankNum}, 300), {
                    req, res, maxAge: 300, path: '/', sameSite: 'strict', httpOnly: true, secure: true
                });

                res.status(200).json(result(true));
            };

            if(process.env.NEXT_PUBLIC_RUN_MODE === 'local') {

                saveBankVrf();
                return;
            }

            const [rows] = await conn.query(`
                SELECT SHPR_BRDT
                     , SHPR_NAME
                  FROM T_SHPR_INFO
                 WHERE SHPR_ID = ?
                   AND SHPR_SCSS_YN = 'N'
            `, [shprId]);

            if(!rows[0]?.SHPR_BRDT) {

                res.status(200).json(result('', '9999', `본인확인이 안된 계정입니다.`));
                return;
            }

            await new Promise(resolve => {

                accountCheckService().checkDepositorInfo('6648802585', param.bankCd, param.bankNum, 'P', rows[0].SHPR_BRDT.substring(0, 6), 'VERYBUSYBEE', resultRes => {

                    if(resultRes.result === 100) {

                        if(resultRes.accountName === rows[0].SHPR_NAME) {

                            saveBankVrf();
                        } else {

                            res.status(200).json(result('', '9999', '예금주명이 상이합니다.'));
                        }
                    } else {

                        res.status(200).json(result('', '9999', '은행 및 통장번호를 확인해 주세요.\n[' + resultRes.resultMessage + ']'));
                    }
                    resolve();
                }, resultRes => {

                    res.status(200).json(result('', '9999', `오류가 발생했습니다.\n[${resultRes?.message}]`));
                    resolve();
                });
            });
        } catch (e) {

            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
            console.log(e);
            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}
