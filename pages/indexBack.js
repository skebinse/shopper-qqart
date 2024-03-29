import React, {useCallback, useEffect, useState} from "react";
import styles from "/styles/index.module.css"
import Image from "next/image";
import {useRouter} from "next/router";
import cmm from "../js/common";
import BtchList from "../components/btchList";
import BottomMenu from "../components/bottomMenu";
import Link from "next/link";
import {cookies} from "next/headers";
import {getCookieParser} from "next/dist/server/api-utils";
import {getCookie} from "cookies-next";

export default function Index(props) {

    const router = useRouter();
    const [addr, setAddr] = useState('');
    const [isInit, setIsInit] = useState(true);
    const [tabIdx, setTabIdx] = useState(0);
    const [loginInfo, setLoginInfo] = useState(null);
    const [dnone, setDnone] = useState('d-none');
    const [isDutjStrt, setIsDutjStrt] = useState(false);
    const [isEntApv, setIsEntApv] = useState(true);
    const [entRefuRsn, setEntRefuRsn] = useState('');
    const [btchInfo, setBtchInfo] = useState({
        btchList: [],
        btchAcpList: [],
    });

    /**
     * 배치 리스트 조회
     */
    const callBtchList = useCallback(isInit => {
        if(!isInit) {

            cmm.loading(true);
            let isAjaxResult = false;
            let isTimeResult = false;

            cmm.ajax({
                url: '/api/btch/btchList',
                isLoaing: false,
                success: res => {

                    if(res.isDutjStrt) {

                        setBtchInfo({btchList: res.btchList, btchAcpList: res.btchAcpList});
                    } else {

                        setLoginInfo(cmm.getLoginInfo());
                    }

                    setDnone('');
                    setIsDutjStrt(res.isDutjStrt);

                    isAjaxResult = true;
                    if(isTimeResult) {

                        cmm.loading(false);
                    }
                }
            });

            setTimeout(() => {

                isTimeResult = true;
                if(isAjaxResult) {

                    cmm.loading(false);
                }

            }, 500);
        } else {

            let dateInfo = cmm.util.getLs('dateInfo');
            dateInfo = dateInfo || {};

            cmm.ajax({
                url: '/api/btch/btchList',
                data:{
                    isLog: dateInfo.log !== cmm.date.getToday(''),
                    appYn: cmm.isApp() ? 'Y' : 'N'
                },
                success: res => {

                    if(res.isDutjStrt) {

                        dateInfo.log = cmm.date.getToday('');
                        cmm.util.setLs('dateInfo', dateInfo);

                        setBtchInfo({btchList: res.btchList, btchAcpList: res.btchAcpList});

                        // 진행중인 배치가 있을 경우
                        if(!!router.query.hasOwnProperty('tabIdx')) {

                            setTabIdx(Number(router.query.tabIdx));
                        } else if(res.btchAcpList.length > 0) {

                            setTabIdx(1);
                        }

                    } else {

                        setLoginInfo(cmm.getLoginInfo());
                    }

                    setDnone('');
                    setIsDutjStrt(res.isDutjStrt);
                    setIsEntApv(res.isEntApv);
                    setEntRefuRsn(res.shprEntRefuRsn);
                }
            });
        }
    }, [router.query]);

    useEffect(() => {

        if(cmm.checkLogin()) {

            let shprAddr = cmm.getLoginInfo('SHPR_ADDR');
            shprAddr = shprAddr.substring(shprAddr.indexOf(' ') + 1);
            shprAddr = shprAddr.substring(shprAddr.indexOf(' ') + 1);

            setAddr(shprAddr);

            // 배치 리스트 조회
            callBtchList(true);
            setIsInit(false);
        } else {

            cmm.alert('로그인 후 이용가능합니다.\n로그인 화면으로 이동합니다.', () => {

                location.href = '/cmm/login';
            });
        }
    }, [callBtchList]);

    const appTest = () => {

        if(process.env.NEXT_PUBLIC_RUN_MODE === 'dev') {

            if(cmm.isApp()) {

                webkit.messageHandlers.cordova_iab.postMessage(JSON.stringify({"action": "getlocation","callback": "window.getPosition"}));
            }
        }
    };

    const appTest2 = () => {

        // if(cmm.isApp()) {
        //
        //     webkit.messageHandlers.cordova_iab.postMessage(JSON.stringify({"action": "qrcamera","callback": "window.getQrCode"}));
        // }
    };

    /**
     * 업무시작 호출
     *
     * @param param
     */
    const callDutjStrt = useCallback(param => {

        param = param || {};
        param.type = 'start';

        cmm.ajax({
            url: '/api/shpr/dutj',
            isLoaing: false,
            data: param,
            success: res => {

                const loginInfo = cmm.util.getLs(cmm.Cont.LOGIN_INFO);

                loginInfo.SHPR_ID = res.SHPR_ID;
                cmm.util.setLs(cmm.Cont.LOGIN_INFO, loginInfo);

                // 리액트 앱일 경우
                if(cmm.isReactApp()) {

                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'LOCATION_INFO_CONSENT',
                        data: {
                            psitTnsmTimer: (120 * 1000),
                            psitTnsmYn: true,
                            psitTnsmYmd: cmm.date.getToday('-'),
                            shprId: res.SHPR_ID
                        }
                    }))
                }
                callBtchList();
            }
        });
    }, [callBtchList]);

    useEffect(() => {

        window.getPosition = (lat, lon) => {

            const options = {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    appKey: process.env.NEXT_PUBLIC_API_TAMP_FREE_KEY
                },
            };

            fetch(`https://apis.openapi.sk.com/tmap/geo/reversegeocoding?version=1&lat=${lat}&lon=${lon}&addressType=A03`, options)
                .then(res => res.json())
                .then(res => {

                    let shprDutjStrtPsit = '';
                    if(!!res.addressInfo) {
                        shprDutjStrtPsit = res.addressInfo.fullAddress;
                    }

                    callDutjStrt({lat, lon, shprDutjStrtPsit});
                })
                .catch(err => {

                    console.error(err);
                });
        };
    }, [callDutjStrt]);

    /**
     * 업무시작 클릭
     */
    const dutjStrtHandler = () => {

        // 업무시작 호출
        callDutjStrt();
        // cmm.loading(true);
        // if(cmm.isApp()) {
        //     webkit.messageHandlers.cordova_iab.postMessage(JSON.stringify({
        //         "action": "getlocation",
        //         "callback": "window.getPosition"
        //     }));
        // } else {
        //
        //     // 업무시작 호출
        //     callDutjStrt();
        // }
    };

    return (
        // <div className={styles.index} style={{height: windowHeight}}>
        <div className={styles.index + ' ' + dnone}>
            {(isEntApv && isDutjStrt) &&
                <>
                    <div className={styles.header}>
                        <Image alt={'로고'} src={'/assets/images/logoWhite.svg'} width={113.6} height={24.5} onClick={appTest} />
                        <Link href={'/join/info'}>
                            <span>{addr}<Image alt={'열기'} src={'/assets/images/icon/iconAllowDown.svg'} width={10.4} height={6} /></span>
                        </Link>
                    </div>
                    <div className={'tabArea'}>
                        <button className={'button mr10 ' + (tabIdx === 0 ? '' : 'white')} onClick={() => setTabIdx(0)}>모든 배치 {btchInfo.btchList.length}</button>
                        <button className={'button ' + (tabIdx === 0 ? 'white' : '')} onClick={() => setTabIdx(1)}>진행중 배치 {btchInfo.btchAcpList.length}</button>
                    </div>
                    <div className={styles.btchArea + ' ' +  (tabIdx === 0 ? '' : styles.ing)}>
                        <BtchList list={btchInfo.btchList} href={'/btch'} isInit={isInit} />
                        <BtchList list={btchInfo.btchAcpList} href={'/btch/ing'} isInit={isInit} noDataTxt={'현재 수락한 배치가 없습니다.'} isIngBtch={true} />
                    </div>
                    <div className={styles.refresh} onClick={() => callBtchList()}>
                        <Image src={'/assets/images/icon/iconRefresh.svg'} alt={'새로고침'} width={18.5} height={18.5} />
                        <span onClick={appTest2}>새로고침</span>
                    </div>
                </>
            }
            <BottomMenu idx={0} />
            {(!!loginInfo && !isDutjStrt && isEntApv) &&
                <div className={styles.dutjStrtDiv}>
                    <Image alt={'로고'} src={'/assets/images/logoWhite.svg'} width={80} height={17} />
                    <div>
                        <Image alt={'프로필사진'} src={loginInfo.SHPR_PRFL_FILE} width={80} height={80} />
                        <p>
                            {loginInfo.SHPR_NCNM}님
                            <b>오늘 하루도 힘내세요!</b>
                        </p>
                        <button type={'button'} onClick={dutjStrtHandler}>업무 시작할께요!</button>
                        <span>
                            <Image alt={'경고'} src={'/assets/images/icon/iconWarningType02.svg'} width={12} height={12} />
                            업무 종료는 <em>마이페이지</em>에서 하실수 있습니다.
                        </span>
                    </div>
                </div>
            }
            {!isEntApv &&
                <div className={styles.entApvDiv}>
                    <Image alt={'로고'} src={'/assets/images/logoWhite.svg'} width={80} height={17} />
                    <div className={styles.textDiv}>
                        <Image alt={'프로필사진'} src={'/assets/images/img/noEntApv.svg'} width={182} height={131} />
                        <h3>
                            신청하신 계정은<br/>
                            {!entRefuRsn &&
                                <>
                                    <em>승인 대기 상태</em>입니다.
                                </>
                            }
                            {!!entRefuRsn &&
                                <>
                                    <em>승인 거절 상태</em>입니다.
                                </>
                            }
                        </h3>
                        {!entRefuRsn &&
                            <>
                                <p>
                                    순차적으로 승인 진행중에 있으니<br/>
                                    조금만 더 기다려주시기 바랍니다.
                                </p>
                                <p>
                                    <em>1533-9171</em>
                                    위 번호로 전화를 드리면<br/>
                                    꼭 받아주세요.
                                </p>
                            </>
                        }
                        {!!entRefuRsn &&
                            <p>
                            아래 거절사유입니다.<br/>
                            “{entRefuRsn}”
                            </p>
                        }
                    </div>
                    <div className={styles.kakaoDiv}>
                        <Image alt={'카카오톡'} src={'/assets/images/icon/iconKakaotalkType01.svg'} width={32} height={45} />
                        <p>
                            카카오톡문의<br/>
                            <a href={'http://pf.kakao.com/_haBuxj/chat'} className={'link'}>http://pf.kakao.com/_haBuxj/chat</a>
                        </p>
                    </div>
                </div>
            }
        </div>
    )
}

export async function getServerSideProps({req, res}) {

    const cookieEncSh = getCookie('enc_sh', {req, res});

    // 쿠키에 값이 있을 경우
    if(!!cookieEncSh) {

        const resData = await cmm.ajaxServer({
            url: process.env.NEXT_PUBLIC_LOCAL_URL + '/api/cmm/getSystCrll',
            isExtr: true,
            data: {
                systCrllSc: '메인화면',
                enc_sh: cookieEncSh,
            },
        });

        if(resData.data === 1) {

            return {
                redirect: {
                    permanent: false,
                    destination: '/main',
                },
                props: {},
            }
        } else {

            return {
                props: {},
            }
        }
    } else {

        return {
            props: {},
        }
    }
}