import styles from "../../styles/login.module.css";
import Image from "next/image";
import React, {useEffect, useState} from "react";
import cmm from "../../js/common";
import useCommon from "../../hooks/useCommon";
import Script from "next/script";
import {useRouter} from "next/router";
import {deleteCookie} from "cookies-next";
import KakaoTalkChat from "../../components/kakaoTalkChat";

export default function Login(props) {

    const {goPage} = useCommon();
    const router = useRouter();
    const [loginInfo, setLoginInfo] = useState({userId: '', userPw: ''});
    const [labelStyle, setLabelStyle] = useState(['', '']);

    useEffect(() => {

        cmm.util.rmLs(cmm.Cont.JOIN_INFO);
        cmm.util.rmLs(cmm.Cont.LOGIN_INFO);
        cmm.util.setLs(cmm.Cont.WEB_TOKEN, '');

        userId.addEventListener('focus', () => {

            setLabelStyle(prevState => prevState.map((style, idx) => idx === 0 ? styles.on : style));
        });

        userId.addEventListener('focusout', () => {

            if(!userId.value) {

                setLabelStyle(prevState => prevState.map((style, idx) => idx === 0 ? '' : style));
            }
        });

        userPw.addEventListener('focus', () => {

            setLabelStyle(prevState => prevState.map((style, idx) => idx === 1 ? styles.on : style));
        });

        userPw.addEventListener('focusout', () => {

            if(!userPw.value) {

                setLabelStyle(prevState => prevState.map((style, idx) => idx === 1 ? '' : style));
            }
        });

        if(!!props && props.p === 'dplcLogin') {
            cmm.alert('중복로그인 되었습니다.<br/>다시 로그인해주세요.');
        }
    }, []);

    /**
     * 회원가입
     */
    const regClick = () => {

        cmm.util.setLs(cmm.Cont.JOIN_INFO, {basis: 'Y', userSnsType: 'ID_PW'});
        goPage('/join/clauAgr');
    };

    /**
     * 로그인
     */
    const loginClick = () => {

        cmm.ajax({
            url: '/api/cmm/login',
            data: {
                userId: loginInfo.userId,
                userPw: loginInfo.userPw,
                appToken: cmm.util.getLs(cmm.Cont.APP_TOKEN),
            },
            success: res => {

                // 가입되지 않은 계정
                if(res.IS_LOGIN === 0) {

                    cmm.alert('아이디 또는 비밀번호가 맞지 않습니다.');
                } else {

                    if(cmm.isApp()) {

                        // 현재 위치 저장
                        webkit.messageHandlers.cordova_iab.postMessage(JSON.stringify({
                            "action": "getlocation",
                            "callback": "window.getPsPsit"
                        }));
                    }

                    cmm.util.setLs(cmm.Cont.LOGIN_INFO, res);
                    router.push('/');
                }
            }
        });
    };

    /**
     * 카카오 로그인
     */
    const kakaoLogin = () => {

        if(!!window.Kakao && !window.Kakao.isInitialized()) {
            window.Kakao.init(process.env.NEXT_PUBLIC_KAKA0_KEY);
        }

        cmm.loading(true);
        window.Kakao.Auth.authorize({
            redirectUri: location.origin + '/cmm/snsKakaoLogin',
        });
        setTimeout(() => {

            cmm.loading(false);
        }, 3000);
    };

    return (
        <>
            <Script src="https://developers.kakao.com/sdk/js/kakao.js" async></Script>
            <div className={styles.login}>
                <Image alt={'로고'} src="/assets/images/logoGreen.svg" priority width={241} height={52} />
                <h3>로그인</h3>
                <ul className={styles.info}>
                    <li className={labelStyle[0]}>
                        <label>아이디</label>
                        <div>
                            <input id={'userId'} value={loginInfo.userId} onChange={e => setLoginInfo(prevState => ({...prevState, userId: e.target.value}))} type="text" />
                        </div>
                    </li>
                    <li className={labelStyle[1]}>
                        <label>비밀번호</label>
                        <div>
                            <input id={'userPw'} value={loginInfo.userPw} onChange={e => setLoginInfo(prevState => ({...prevState, userPw: e.target.value}))} type="password" />
                        </div>
                    </li>
                </ul>
                <p>
                    <span onClick={regClick}>
                        회원가입
                    </span>
                </p>
                <button className={styles.kakaoDiv} type={'button'} onClick={kakaoLogin}>
                    <Image alt="카카오톡 아이콘" src="/assets/images/icon/iconKakaotalk.svg" width={33.5} height={22.6} />
                    카카오톡으로 로그인
                </button>
                <div className={styles.cpnyInfo}>
                    <div>
                        <span>상호: (주) 베리비지비</span>
                        <span>대표 : 김채영</span>
                        {/*<span>사업장주소: 서울특별시 송파구 송이로 242, 602호</span>*/}
                        <span>사업자등록번호 : 664-88-02585</span>
                        <span>대표전화번호: 1533-9171</span>
                    </div>
                    <div>
                        <span>고객센터 운영시간 : 10:00 ~ 20:00(연중무휴)</span>
                        <span>대표 이메일: <a href="mailto:qqcart.shop@gmail.com">qqcart.shop@gmail.com</a></span>
                    </div>
                    <div>
                        <span>2023 © <em>퀵퀵카트 쇼퍼</em> All Rights Reserved.</span>
                    </div>
                </div>
                <div className={styles.btnArea}>
                    <button type={"button"} onClick={loginClick} disabled={!loginInfo.userId || !loginInfo.userPw}>로그인</button>
                </div>
            </div>
            <KakaoTalkChat />
        </>
    );
}
export async function getServerSideProps({req, res, query }) {

    deleteCookie('enc_sh', {req, res});
    deleteCookie('tkn_sh', {req, res});

    return {
        props: {
            p: !!query.p ? query.p : ''
        },
    }
}