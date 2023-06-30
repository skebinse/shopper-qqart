import React, {useCallback, useEffect, useState} from "react";
import styles from "/styles/index.module.css"
import Image from "next/image";
import {useRouter} from "next/router";
import cmm from "../js/common";
import BtchList from "../components/btchList";
import BottomMenu from "../components/bottomMenu";
import Link from "next/link";

export default function Index(props) {

    const router = useRouter();
    const [addr, setAddr] = useState('');
    const [isInit, setIsInit] = useState(true);
    const [tabIdx, setTabIdx] = useState(0);
    const [loginInfo, setLoginInfo] = useState(null);
    const [dnone, setDnone] = useState('d-none');
    const [isDutjStrt, setIsDutjStrt] = useState(false);
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

            }, 950);
        } else {

            let dateInfo = cmm.util.getLs('dateInfo');
            dateInfo = dateInfo || {};

            cmm.ajax({
                url: '/api/btch/btchList',
                data:{
                    isLog: dateInfo.log !== cmm.date.getToday('')
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
            url: '/api/cmm/dutj',
            isLoaing: false,
            data: param,
            success: res => {

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
            {isDutjStrt &&
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
            {(!!loginInfo && !isDutjStrt) &&
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
        </div>
    )
}

export async function getServerSideProps(context) {

    return {
        props: {},
    }
}