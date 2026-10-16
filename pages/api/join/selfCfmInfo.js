import {result} from "../db";
import {getJoinSession} from "../../../util/joinSession";

/**
 * 가입 세션의 본인인증 정보 조회 (화면 표시용: 이름, 생년월일 6자리)
 */
export default async function handler(req, res) {

    const session = getJoinSession(req, res);

    if(!session?.name) {

        res.status(200).json(result('', '9999', '본인인증 정보가 없습니다.\n본인인증을 다시 진행해 주세요.'));
        return;
    }

    res.status(200).json(result({
        name: session.name,
        brdt: String(session.iden ?? '').substring(0, 6),
    }));
}
