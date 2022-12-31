import styles from "../../styles/login.module.css";
import Head from "next/head";
import Image from "next/image";
import {useEffect} from "react";
import $cmm from "../../js/common";
import useCommon from "../../hooks/useCommon";

export default function Login(props) {

    const {goPage, alert} = useCommon();

    useEffect(() => {

        if(!!window.Kakao && !window.Kakao.isInitialized()) {
            window.Kakao.init(process.env.NEXT_PUBLIC_KAKA0_KEY);
        }
    }, []);

    /**
     * 카카오 로그인
     */
    const kakaoLoing = () => {

        if(!!window.Kakao && !window.Kakao.isInitialized()) {
            window.Kakao.init(process.env.NEXT_PUBLIC_KAKA0_KEY);
        }

        window.Kakao.Auth.login({
            success: function(authObj) {
                Kakao.API.request({
                    url: '/v2/user/me',
                    success: function(res) {

                        const param = {
                            userCrctno: res.id,
                            userSnsType: 'KAKAO',
                        };

                        if(!!res.kakao_account) {
                            const account = res.kakao_account;
                            param.userEmal = !!account.email ? account.email : '';

                            if(!!account.profile) {
                                const profile = account.profile;
                                // param.userNcnm = !!profile.nickname ? profile.nickname : '';
                                param.userPrfl = !!profile.profile_image_url ? profile.profile_image_url : '';
                                param.userTnalPrfl = !!profile.thumbnail_image_url ? profile.thumbnail_image_url : param.profileImg;
                            }
                        }

                        $cmm.ajax({
                            url: '/api/login',
                            data: param,
                            success: res => {

                                // 가입되지 않은 계정
                                if(res.IS_LOGIN === 0) {

                                    goPage('/join/clauAgr', param);
                                } else {

                                    $cmm.util.setLs($cmm.Cont.LOING_INFO, res);
                                    goPage('/');
                                }
                            }
                        });
                    },
                    fail: function(res) {

                        alert('로그인에 실패하였습니다.<br>' + JSON.stringify(res));
                    }
                });
            },
            fail: function(err) {
                alert(JSON.stringify(err));
            },
        });
    };
    return (
        <>
            <Head>
                <script src="https://developers.kakao.com/sdk/js/kakao.js" async></script>
            </Head>
            <div className={styles.login}>
                <Image alt={'로고'} src="/assets/images/logoGreen.svg" width={241} height={52} />
                <h3>로그인</h3>
                <p>퀵퀵카트 쇼퍼는 SNS로 로그인하여 간편하게 서비스를 이용하실 수 있습니다.</p>
                <button type={'button'} onClick={kakaoLoing}>
                    <Image alt="카카오톡 아이콘" src="/assets/images/icon/iconKakaotalk.svg" width={33.5} height={22.6} />
                        카카오톡으로 로그인
                </button>
            </div>
        </>
    );
}