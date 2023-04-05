import styles from "../../styles/login.module.css";
import Image from "next/image";
import {useEffect, useState} from "react";
import cmm from "../../js/common";
import useCommon from "../../hooks/useCommon";
import Link from "next/link";

export default function Login(props) {

    const {goPage, alert, fontAjax} = useCommon();
    const [loginInfo, setLoginInfo] = useState({userId: '', userPw: ''});
    const [labelStyle, setLabelStyle] = useState(['', '']);

    useEffect(() => {

        if(!!window.Kakao && !window.Kakao.isInitialized()) {
            window.Kakao.init(process.env.NEXT_PUBLIC_KAKA0_KEY);
        }

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

    return (
        <>
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
                <div className={styles.btnArea}>
                    <button type={"button"} onClick={loginClick} disabled={!loginInfo.userId || !loginInfo.userPw}>로그인</button>
                </div>
            </div>
        </>
    );
}