import React, {useEffect} from "react";
import cmm from "../../js/common";
import useCommon from "../../hooks/useCommon";

export default function Login(props) {

    const {goPage} = useCommon();

    useEffect(() => {

        if(!!props.profile) {

            const param = {
                userCrctno: props.profile.id,
                userSnsType: 'KAKAO',
            };

            if(cmm.isApp() && !!cmm.util.getLs(cmm.Cont.APP_TOKEN)) {

                // PUSH Token
                param.appToken = cmm.util.getLs(cmm.Cont.APP_TOKEN);
            }

            if(!!props.profile.kakao_account) {

                const account = props.profile.kakao_account;
                param.userEmal = !!account.email ? account.email : '';

                if(!!account.profile) {
                    const profile = account.profile;
                    param.userPrfl = !!profile.profile_image_url ? profile.profile_image_url : '';
                    param.userTnalPrfl = !!profile.thumbnail_image_url ? profile.thumbnail_image_url : param.profileImg;
                }
            }

            cmm.ajax({
                url: '/api/login',
                data: param,
                success: res => {

                    // 가입되지 않은 계정
                    if(res.IS_LOGIN === 0) {

                        cmm.util.setLs(cmm.Cont.JOIN_INFO, param);
                        goPage('/join/clauAgr');
                    } else {

                        cmm.util.setLs(cmm.Cont.LOGIN_INFO, res);
                        location.href = '/';
                    }
                }
            });
        }
    }, [props.profile, goPage]);

    return (
        <>
        </>
    );
}

export async function getServerSideProps(context) {

    const data = {
        grant_type: 'authorization_code',
        client_id: 'dc6e9cd5281395107b6f48fbdf3b0ab1',
        redirect_uri: process.env.LOCAL_URL + '/cmm/snsKakaoLogin',
        code: context.query.code,
    };

    const accessToken = await fetch('https://kauth.kakao.com/oauth/token', {
        body: new URLSearchParams(data),
        headers: {
            contentType: 'application/x-www-form-urlencoded;charset=utf-8'
        },
        method: 'POST',
    }).then(res => res.json()).then(res => res.access_token);

    const profile = await fetch('https://kapi.kakao.com/v2/user/me', {
        headers: {
            Authorization: 'Bearer ' + accessToken
        },
    }).then(res => res.json());

    return {
        props: {
            profile
        },
    }
}