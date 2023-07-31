import {getConnectPool, result} from "../db";
import {accountCheckService } from "../../../js/popbill"
import bcrypt from 'bcrypt';

export default async function handler(req, res) {

    const param = req.body;

    accountCheckService().checkDepositorInfo('6648802585', param.backCd, param.backNum, 'P', param.iden.substring(0, 6), 'VERYBUSYBEE', async resultRes => {
        console.log(resultRes)

        if(resultRes.result === 100) {

            if(await bcrypt.compare(resultRes.accountName, param.nameHash)) {

                res.status(200).json(result(''));
            } else {

                res.status(200).json(result('', '9999', '예금주명이 상이합니다.'));
            }
        } else {

            res.status(200).json(result('', '9999', '은행 및 통장번호를 확인해 주세요.\n[' + resultRes.resultMessage + ']'));
        }
    }, resultRes => {

        res.status(200).json(result(resultRes, '9999', '오류가 발생했습니다.'));
    });
}