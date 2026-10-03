import {getConnectPool, result} from "../db";
import {getCookie, setCookie} from "cookies-next";
import {getKakaoUserId} from "../../../util/kakaoUtil";
import {getAuthShprId} from "../../../util/authUtil";
import {clearJoinSession, getJoinSession} from "../../../util/joinSession";

/**
 * 빈 값 여부 (form-urlencoded 로 넘어온 'undefined' / 'null' 문자열 포함)
 * @param value
 * @returns {boolean}
 */
const isEmpty = value => value === undefined || value === null || String(value).trim() === '' || value === 'undefined' || value === 'null';

/**
 * 필수 파라미터 검증
 * 본문 없이 호출되면 SP 의 중복 체크가 NULL 비교로 모두 통과해 빈 T_SHPR_INFO 행이 INSERT 된다.
 * @param param
 * @returns {string} 오류 메시지 (정상이면 '')
 */
const validate = param => {

    if(!param || typeof param !== 'object') {

        return '잘못된 요청입니다.';
    } else if(param.isLogin !== 'Y' && param.isLogin !== 'N') {

        return '잘못된 요청입니다.';
    } else if(param.userSnsType !== 'KAKAO' && param.userSnsType !== 'ID_PW') {

        return '잘못된 요청입니다.';
    } else if(param.userSnsType === 'KAKAO' && isEmpty(param.userCrctno)) {

        return '카카오 회원정보가 없습니다.';
    } else if(param.userSnsType === 'ID_PW' && isEmpty(param.userId)) {

        return '아이디를 입력해 주세요.';
    } else if(param.userSnsType === 'ID_PW' && param.isLogin === 'N' && isEmpty(param.userPw)) {

        return '비밀번호를 입력해 주세요.';
    } else if(isEmpty(param.userNcnm)) {

        return '닉네임을 입력해 주세요.';
    } else if(isEmpty(param.userZipc)) {

        return '지역을 선택해 주세요.';
    }

    return '';
};

export default async function handler(req, res) {

    if(req.method !== 'POST') {

        res.setHeader('Allow', 'POST');
        res.status(405).json(result('', '9999', '잘못된 요청입니다.'));
        return;
    }

    const errorMsg = validate(req.body);

    if(!!errorMsg) {

        res.status(200).json(result('', '9999', errorMsg));
        return;
    }

    await getConnectPool(async conn => {

        const param = req.body;

        try {

            // 개인정보 수정: 로그인 쿠키의 본인 계정만 수정 (클라이언트가 보낸 식별값은 무시하고 DB 값 사용)
            if(param.isLogin === 'Y') {

                const shprId = await getAuthShprId(conn, req, res);

                if(!shprId) {

                    return;
                }

                const [shprRows] = await conn.query(`
                    SELECT SHPR_SNS_TYPE
                         , SHPR_CRCTNO
                         , SHPR_LOGIN_ID
                      FROM T_SHPR_INFO
                     WHERE SHPR_ID = ?
                `, [shprId]);

                const shpr = shprRows[0];

                if(shpr.SHPR_SNS_TYPE !== 'KAKAO' && shpr.SHPR_SNS_TYPE !== 'ID_PW') {

                    res.status(200).json(result('', '9999', '회원 정보가 올바르지 않습니다.\n고객센터로 문의해 주세요.'));
                    return;
                }

                param.userSnsType = shpr.SHPR_SNS_TYPE;
                param.userCrctno = shpr.SHPR_CRCTNO;
                param.userId = shpr.SHPR_LOGIN_ID;
            }

            // 신규 가입: 본인인증/계좌 정보는 서버가 서명한 가입 세션 값만 사용 (클라이언트 값 무시)
            if(param.isLogin === 'N') {

                const session = getJoinSession(req, res);

                if(!session?.name || !session.bankVrfd) {

                    res.status(200).json(result('', '9999', '본인인증 정보가 만료되었습니다.\n본인인증부터 다시 진행해 주세요.'));
                    return;
                }

                param.name = session.name;
                param.iden = session.iden;
                param.cphoneNo = session.cphoneNo;
                param.bankNm = session.bankNm;
                param.bankNum = session.bankNum;
            }

            // 카카오 신규 가입: 클라이언트가 보낸 회원번호 대신 액세스 토큰으로 카카오에서 확인한 회원번호 사용
            if(param.userSnsType === 'KAKAO' && param.isLogin === 'N') {

                const kakaoUserId = await getKakaoUserId(param.kakaoAccessToken);

                if(!kakaoUserId) {

                    res.status(200).json(result('', '9999', '카카오 인증정보가 만료되었습니다.\n카카오 로그인부터 다시 진행해 주세요.'));
                    return;
                }

                param.userCrctno = kakaoUserId;
            }

            const [rows, fields] = await conn.query('call spInsShprJoin(?, ?, ?, ?, ?, ?, ' +
                                                                    '?, ?, ?, ?, ?, ?, ' +
                                                                    '?, ?, ?, ?, ?, ?, ' +
                                                                    '?, ?, ?, ?, ?, ?,' +
                                                                    '?, ?, ?, ?, ?, ?, ?, ?)', [
                param.userCrctno, param.userEmal, param.userNcnm, param.userPrfl, param.userTnalPrfl, param.userSnsType,
                param.userStdoCd, param.userZipc, param.userAddr, '', param.cphoneNo, param.userAddrLat,
                param.userAddrLot, '', '', param.atchFileUuid, param.shprSfitdText, process.env.ENC_KEY,
                param.userId, param.userPw, (param.appToken === 'null' ? '' : param.appToken), param.shprDelyPosDtc, param.mktnAgrYn, param.isLogin,
                param.name, param.bankNm, param.bankNum, param.shprDrvLicAtchFileUuid, param.shprVhclKd, param.shprVhclNm, param.shprVhclNo, param.iden
            ]);

            const item = rows?.[0]?.[0];

            if(!item) {

                res.status(200).json(result('', '9999', '가입 처리 결과가 없습니다.'));
                return;
            }

            // 쿠키 등록
            if(item.IS_LOGIN === 1) {

                if(param.isLogin === 'N') {

                    setCookie('enc_sh', item.ENC_SHPR_ID, {
                        req, res, maxAge: 2592000, sameSite: 'strict', httpOnly: true,  secure: true
                    });
                    setCookie('tkn_sh', item.SHPR_DPLC_LOGIN_TKN, {
                        req, res, maxAge: 2592000, sameSite: 'strict', httpOnly: true,  secure: true
                    });

                    clearJoinSession(req, res);
                }

                res.status(200).json(result({
                    IS_LOGIN: item.IS_LOGIN,
                    SHPR_ADDR: item.SHPR_ADDR,
                    LOING_DT: item.LOING_DT,
                    SHPR_NCNM: item.SHPR_NCNM,
                    SHPR_PRFL_FILE: item.SHPR_PRFL_FILE,
                    LOGIN_VER: item.LOGIN_VER,
                    SHPR_GRD_CD: item.SHPR_GRD_CD,
                }));
            } else {
                res.status(200).json(result(item));
            }

        } catch (e) {

            console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
            console.log(e);

            res.status(500).json(result('', '9999', '오류가 발생했습니다.'));
        }
    });
}