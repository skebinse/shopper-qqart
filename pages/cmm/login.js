import styles from "../../styles/login.module.css";
import Image from "next/image";
import React, {useEffect, useState} from "react";
import cmm from "../../js/common";
import useCommon from "../../hooks/useCommon";
import Link from "next/link";
import Script from "next/script";

export default function Login(props) {

    const {goPage} = useCommon();
    const [loginInfo, setLoginInfo] = useState({userId: '', userPw: ''});
    const [labelStyle, setLabelStyle] = useState(['', '']);

    useEffect(() => {

        if(!!window.Kakao && !window.Kakao.isInitialized()) {
            window.Kakao.init(process.env.NEXT_PUBLIC_KAKA0_KEY);
        }

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
    }, []);

    /**
     * 회원가입
     */
    const regClick = () => {

        goPage('/join/clauAgr', {basis: 'Y', userSnsType: 'ID_PW'});
    };

    /**
     * 로그인
     */
    const loginClick = () => {

        cmm.ajax({
            url: '/api/login',
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

                    cmm.util.setLs(cmm.Cont.LOGIN_INFO, res);
                    location.href = '/';
                }
            }
        });
    };

    /**
     * 카카오 로그인
     */
    const kakaoLoing = () => {

        if(!!window.Kakao && !window.Kakao.isInitialized()) {
            window.Kakao.init(process.env.NEXT_PUBLIC_KAKA0_KEY);
        }
        window.Kakao.Auth.authorize({
            redirectUri: location.origin + '/cmm/snsKakaoLogin',
        });
        return;
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

                        cmm.ajax({
                            url: '/api/login',
                            data: param,
                            success: res => {

                                // 가입되지 않은 계정
                                if(res.IS_LOGIN === 0) {

                                    goPage('/join/clauAgr', param);
                                } else {

                                    cmm.util.setLs(cmm.Cont.LOGIN_INFO, res);
                                    location.href = '/';
                                }
                            }
                        });
                    },
                    fail: function(res) {

                        cmm.alert('로그인에 실패하였습니다.<br>' + JSON.stringify(res));
                    }
                });
            },
            fail: function(err) {
                cmm.alert(JSON.stringify(err));
            },
        });
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
                <button className={styles.kakaoDiv} type={'button'} onClick={kakaoLoing}>
                    <Image alt="카카오톡 아이콘" src="/assets/images/icon/iconKakaotalk.svg" width={33.5} height={22.6} />
                    카카오톡으로 로그인
                </button>
                <div className={styles.cpnyInfo}>
                    <div>
                        <span>상호: (주) 베리비지비</span>
                        <span>대표 : 김채영</span>
                        <span>사업장주소: 서울특별시 송파구 송이로 242, 602호</span>
                        <span>사업자등록번호 : 664-88-02585</span>
                        <span>대표전화번호: 1855-0582</span>
                    </div>
                    <div>
                        <span>고객센터 운영시간 : 09:00 ~ 21:00(연중무휴)</span>
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
        </>
    );
}