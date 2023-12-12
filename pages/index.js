import React, {useCallback, useEffect, useRef, useState} from "react";
import styles from "/styles/main.module.css"
import Image from "next/image";
import {useRouter} from "next/router";
import cmm from "../js/common";
import BtchList from "../components/btchListMain";
import BottomMenu from "../components/bottomMenu";
import Sheet from 'react-modal-sheet';
import {useGlobal} from "../context/globalContext";

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
    const [isSheetOpen, setSheetOpen] = useState(false);
    const [isDtcOptmBtn, setIsDtcOptmBtn] = useState(false);
    const [snapIdx, setSnapIdx] = useState(1);
    const [mapShopId, setMapShopId] = useState(null);
    const [mapPsitInfo, setMapPsitInfo] = useState(null);
    const {pushCnt} = useGlobal();
    const [btchInfo, setBtchInfo] = useState({btchList: [], btchAcpList: []});
    const sheetRef = useRef();
    const sheetScrollRef = useRef();
    const ulBtchAll = useRef();
    const ulBtchIng = useRef();
    const isListDown = useRef(false);
    const btchAreaInfo = useRef({
        translateY: 1000
    });
    const listTranslateY = useRef(1000);

    /**
     * 메인 지도 생성
     * @param data
     */
    const createMap = data => {

        const container = document.getElementById('kakaoMap'); //지도를 담을 영역의 DOM 레퍼런스
        const shprLatLng = new kakao.maps.LatLng(data.shprPsitLot, data.shprPsitLat);
        const options = { //지도를 생성할 때 필요한 기본 옵션
            center: shprLatLng, //지도의 중심좌표.
            level: 5 //지도의 레벨(확대, 축소 정도)
        };

        const map = new kakao.maps.Map(container, options); //지도 생성 및 객체 리턴

        kakao.maps.event.addListener(map, 'center_changed', function() {

            document.querySelectorAll('.markerInfo').forEach(elet => {

                elet.parentElement.style.transform = 'translateY(-42px)';
            });
        });

        // 현재위치 마커 주소입니다
        const imageSrc = '/assets/images/icon/map/iconMapShopper.png';
        const imageSize = new kakao.maps.Size(32, 32);

        // 현재 위치 마커를 생성합니다
        const marker = new kakao.maps.Marker({
            position: shprLatLng,
            image: new kakao.maps.MarkerImage(imageSrc, imageSize),
        });

        marker.setMap(map);

        const bounds = new kakao.maps.LatLngBounds();
        bounds.extend(shprLatLng);

        // 마커 표시
        if(!!data.list && data.list.length > 0) {

            // 마커 툴팁 표시
            const tooltipInfo = {};
            data.list.forEach(item => {

                const key = item.ODER_DELY_ADDR_LAT + item.ODER_DELY_ADDR_LOT;
                if(!tooltipInfo[key]) {

                    tooltipInfo[key] = [];
                }

                tooltipInfo[key].push((!!item.ODER_RPRE_NO && item.ODER_RPRE_NO.length === 11) ? cmm.util.getNumber(item.ODER_RPRE_NO.substring(6)) : item.ODER_RPRE_NO);
            });

            data.list.forEach(item => {

                // 마커 주소입니다 ODER_OPTM_DTC_SEQ
                let imageSrc = (item.ODER_PGRS_STAT === '02' || item.ODER_PGRS_STAT === '03') ? '/assets/images/icon/map/iconMapStore.png' : '/assets/images/icon/map/iconMapUser.png';
                let tooltipTxt = '';
                let classNm = 'store';

                if(!!(item.ODER_PGRS_STAT === '02' || item.ODER_PGRS_STAT === '03')) {

                    tooltipTxt = tooltipInfo[item.ODER_DELY_ADDR_LAT + item.ODER_DELY_ADDR_LOT].length + '건';
                } else {

                    classNm = 'customer';
                    tooltipTxt = '주문번호 ' + tooltipInfo[item.ODER_DELY_ADDR_LAT + item.ODER_DELY_ADDR_LOT].join(',');
                }

                if(!!item.ODER_OPTM_DTC_SEQ && item.ODER_OPTM_DTC_SEQ < 99) {
                    imageSrc = `/assets/images/icon/map/icoMapPersonalNum_${item.ODER_OPTM_DTC_SEQ}.png`
                }

                const imageSize = new kakao.maps.Size(32, 32);
                const markerPosition = new kakao.maps.LatLng(item.ODER_DELY_ADDR_LOT, item.ODER_DELY_ADDR_LAT);
                bounds.extend(markerPosition);

                // 현재 위치 마커를 생성합니다
                const marker = new kakao.maps.Marker({
                    position: markerPosition,
                    image: new kakao.maps.MarkerImage(imageSrc, imageSize),
                    clickable: true
                });

                // 마커에 클릭이벤트를 등록합니다
                kakao.maps.event.addListener(marker, 'click', function() {
                    mapMarkerClickHandler(item);
                });

                const tooltip = new kakao.maps.CustomOverlay({
                    position : markerPosition,
                    content : `<div class="markerInfo ${classNm}">${tooltipTxt}</div>`,
                    map: map,
                    removable: true,
                });

                marker.setMap(map);
            });

            map.setBounds(bounds);
        }
    };

    /**
     * 마커 클릭 이벤트
     * @param item
     */
    const mapMarkerClickHandler = item => {

        // 배치 수락
        if(item.ODER_PGRS_STAT === '02' || item.ODER_PGRS_STAT === '03') {

            setMapShopId(item.SHOP_ID);
            setMapPsitInfo(null);
        } else {

            setMapShopId(null);
            setMapPsitInfo(item.ODER_DELY_ADDR_LAT + ',' + item.ODER_DELY_ADDR_LOT);
        }

        // btchArea Y 위치 변경
        btchAreaYPsit(0);
    }

    /**
     * 쇼퍼 위치 확인 후 지도 생성
     */
    const shopperPosition = list => {

        // 현재 위치 가져오기
        cmm.util.getCurrentPosition(res => {
            createMap({
                shprPsitLat: res.lot,
                shprPsitLot: res.lat,
                list,
            });
        });
    };

    useEffect(() => {

        setTimeout(() => {

            btchAreaInfo.current.translateY = window.innerHeight - 200;

            if(!!document.querySelector('#ch-plugin')) {
                document.querySelector('#ch-plugin').classList.add('d-none');
            }
        }, 500);

        return () => {
            if(!!document.querySelector('#ch-plugin')) {
                document.querySelector('#ch-plugin').classList.remove('d-none');
            }
        };
    }, []);

    /**
     * 배치 리스트 조회
     */
    const callBtchList = (isInit, pgrsRslt) => {

        if(!isInit) {

            cmm.loading(true);
            let isAjaxResult = false;
            let isTimeResult = false;

            cmm.ajax({
                url: '/api/btch/btchList',
                isLoaing: false,
                success: res => {

                    if(res.isDutjStrt) {

                        // 쇼퍼 위치 확인 후 지도 생성
                        shopperPosition(tabIdx === 0 ? res.btchList : res.btchAcpList);
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

                    if(!!pgrsRslt) {

                        setMapShopId(null);
                        setMapPsitInfo(null);
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

                        let currentList = res.btchList;
                        // 진행중인 배치가 있을 경우
                        if(!!router.query.hasOwnProperty('tabIdx')) {

                            setTabIdx(Number(router.query.tabIdx));
                            currentList = Number(router.query.tabIdx) === 0 ? res.btchList : res.btchAcpList;

                            // 쇼퍼 위치 확인 후 지도 생성
                            shopperPosition(currentList);
                        } else if(res.btchAcpList.length > 0) {

                            setTabIdx(1);
                            currentList = res.btchAcpList;
                        } else {

                            // 쇼퍼 위치 확인 후 지도 생성
                            shopperPosition(currentList);
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
    };

    useEffect(() => {

        const script = document.createElement("script");
        script.src =
            "https://dapi.kakao.com/v2/maps/sdk.js?appkey=dc6e9cd5281395107b6f48fbdf3b0ab1&autoload=false";
        document.head.appendChild(script);

        script.onload = () => {
            kakao.maps.load(() => {

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
            });
        };
    }, []);

    const appTest = () => {

        if(process.env.NEXT_PUBLIC_RUN_MODE === 'dev') {

            if(cmm.isApp()) {

                webkit.messageHandlers.cordova_iab.postMessage(JSON.stringify({"action": "getlocation","callback": "window.getPosition"}));
            }
        }
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

    /**
     * 업무 시작일 경우
     */
    useEffect(() => {
        console.log(isEntApv, isDutjStrt);
        if(isEntApv && isDutjStrt) {

            btchAreaInfo.current.translateY = window.innerHeight - 200;
            // btchArea Y 위치 변경
            btchAreaYPsit(btchAreaInfo.current.translateY);
            document.querySelector('.btchListArea').classList.add(styles.transition);
        }
    }, [isEntApv, isDutjStrt]);

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
    };

    /**
     * sheet open/close
     */
    useEffect(() => {

        if(!isSheetOpen) {
            setSheetOpen(true);
        }
    }, [isSheetOpen]);

    /**
     * 모든배치/진행중 배치 탭 변경
     */
    useEffect(() => {

        if(btchInfo.btchList.length > 0 || btchInfo.btchAcpList.length > 0) {

            // 쇼퍼 위치 확인 후 지도 생성
            shopperPosition(tabIdx === 0 ? btchInfo.btchList : btchInfo.btchAcpList);
        }

        setIsDtcOptmBtn(tabIdx === 1);
    }, [tabIdx]);

    /**
     * sheet 위치 변경
     * @param snapIdx
     */
    const sheetSnapHandler = snapIdx => {

        setSnapIdx(snapIdx);

        if(snapIdx === 1) {
            setMapShopId(null);
            setMapPsitInfo(null);
            sheetScrollRef.current.scrollTop = 0;
            ulBtchAll.current.scrollTop = 0;
            ulBtchIng.current.scrollTop = 0;
        }
    }

    /**
     * 동선 최적화 버튼
     */
    const dtcOptmHandler = () => {

        if(tabIdx === 1) {

            const oderUserIds = [];
            btchInfo.btchAcpList.forEach(item => {

                if(item.ODER_PGRS_STAT === '03' || item.ODER_PGRS_STAT === '04') {

                    cmm.alert('모든 물품을 수령 후 이용 가능합니다.');
                    return false;
                } else {

                    oderUserIds.push(item.ODER_USER_ID);
                }
            });

            if(oderUserIds.length > 0) {

                cmm.util.getCurrentPosition(res => {

                    cmm.ajax({
                        url: '/api/btch/ing/btchDtcOptm',
                        data: {
                            oderUserIds: oderUserIds.join(','),
                            lat: res.lat,
                            lot: res.lot,
                        },
                        success: res => {
                            // 새로 고침
                            callBtchList();
                        }
                    });
                });
            }
        }
    };

    /**
     * 업무 종료
     */
    const dutjEndHanler = () => {

        cmm.confirm('업무를 종료하시겠습니까?', () => {

            cmm.ajax({
                url: '/api/shpr/dutj',
                data: {
                    type: 'end'
                },
                success: res => {

                    // 리액트 앱일 경우
                    if(cmm.isReactApp()) {

                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'LOCATION_INFO_CONSENT',
                            data: {
                                psitTnsmYn: false,
                            }
                        }))
                    }

                    // 배치 리스트 조회
                    callBtchList();
                }
            });
        });
    };

    /**
     * 탭 클릭 시
     * @param _tabIdx
     */
    const tabClickHandler = _tabIdx => {

        if(_tabIdx === tabIdx) {

            if(document.querySelector('.btchListArea').style.transform !== 'translateY(0px)') {

                // btchArea Y 위치 변경
                btchAreaYPsit(0);
            }
        } else {

            setTabIdx(_tabIdx);
        }
    };

    /**
     * PUSH 알림
     */
    useEffect(() => {

        if(pushCnt > 0) {

            if(snapIdx !== 0) {

                sheetRef.current.snapTo(0);
            }
            setTabIdx(0);

            // 배치 리스트 조회
            callBtchList();
        }
    }, [pushCnt]);

    /**
     * 터치 시작
     * @param e
     */
    const touchStartHandler = e => {

        btchAreaInfo.current.startPageY = e.targetTouches[0].pageY;
        if(!e.target.closest('.btchArea')) {

            isListDown.current = true;
        } else if(tabIdx === 0) {

            isListDown.current = ulBtchAll.current.scrollTop === 0;
        } else {

            isListDown.current = ulBtchIng.current.scrollTop === 0;
        }
    };

    /**
     * 터치 종료
     * @param e
     */
    const touchEndHandler = e => {

        if(Math.abs(btchAreaInfo.current.startPageY - e.changedTouches[0].pageY) < 20) {
            return;
        }

        // 위로
        if(btchAreaInfo.current.startPageY > e.changedTouches[0].pageY) {

            // btchArea Y 위치 변경
            btchAreaYPsit(0);
        // 아래로
        } else if(isListDown.current && btchAreaInfo.current.startPageY < e.changedTouches[0].pageY) {

            // btchArea Y 위치 변경
            btchAreaYPsit(btchAreaInfo.current.translateY);
        }
    };

    /**
     * btchArea Y 위치 변경
     * @param snapIdx
     */
    const btchAreaYPsit = y => {

        document.querySelector('.btchListArea').style.transform = `translateY(${y}px)`;

        if(y > 0) {
            setMapShopId(null);
            setMapPsitInfo(null);
            ulBtchAll.current.scrollTop = 0;
            ulBtchIng.current.scrollTop = 0;
        }
    }

    return (
        <div className={styles.index + ' ' + dnone}>
            {(isEntApv && isDutjStrt) &&
                <>
                    <div className={styles.header}>
                        <div>
                            <Image alt={'로고'} src={'/assets/images/logoWhite.svg'} width={113.6} height={24.5} onClick={appTest} />
                        </div>
                        <button type={'button'} onClick={dutjEndHanler}>업무 종료</button>
                    </div>
                    <div id="kakaoMap" style={{height: 'calc(100% - 210px)'}}></div>
                    <div className={'btchListArea ' + styles.btchListArea} onTouchStart={touchStartHandler} onTouchEnd={touchEndHandler}>
                        <div className={styles.btchListHeader}>
                            <span></span>
                            <span></span>
                        </div>
                        <div className={styles.btchListCont}>
                            {!mapShopId && !mapPsitInfo &&
                                <div className={'tabArea'}>
                                    <div>
                                        <button className={'button ' + (tabIdx === 0 ? 'on' : '')} onClick={() => tabClickHandler(0)}>모든 배치 {btchInfo.btchList.length}</button>
                                        <button className={'button ' + (tabIdx === 0 ? '' : 'on')} onClick={() => tabClickHandler(1)}>진행중 배치 {btchInfo.btchAcpList.length}</button>
                                    </div>
                                </div>
                            }
                            <div className={'btchArea' + ' ' +  (tabIdx === 0 ? '' : 'ing') + ' '}>
                                <BtchList ulRef={ulBtchAll} list={btchInfo.btchList} href={'/btch'} filter={tabIdx === 0 ? {mapShopId, mapPsitInfo} : null} isInit={isInit} reflashHandler={pgrsRslt => callBtchList(false, pgrsRslt)} />
                                <BtchList ulRef={ulBtchIng} list={btchInfo.btchAcpList} href={'/btch/ing'} filter={tabIdx === 1 ? {mapShopId, mapPsitInfo} : null} isInit={isInit} noDataTxt={'현재 수락한 배치가 없습니다.'} isIngBtch={true} reflashHandler={pgrsRslt => callBtchList(false, pgrsRslt)} />
                            </div>
                        </div>
                    </div>
                    <div className={styles.refresh} onClick={() => callBtchList()}>
                        <Image src={'/assets/images/icon/iconRefreshBlack.svg'} alt={'새로고침'} width={18.5} height={18.5} />
                        <span>새로고침</span>
                    </div>
                </>
            }
            <BottomMenu idx={0} />
            {(!!loginInfo && !isDutjStrt && isEntApv) &&
                <div className={styles.dutjStrtDiv}>
                    <Image alt={'로고'} src={'/assets/images/logoWhite.svg'} width={80} height={17} />
                    <div>
                        <img alt={'프로필사진'} src={loginInfo.SHPR_PRFL_FILE} />
                        <p>
                            {loginInfo.SHPR_NCNM}님
                            <b>오늘 하루도 힘내세요!</b>
                        </p>
                        <button type={'button'} onClick={dutjStrtHandler}>업무 시작할께요!</button>
                        <span>
                            <Image alt={'경고'} src={'/assets/images/icon/iconWarningType02.svg'} width={12} height={12} />
                            업무 종료시 <em>업무종료 버튼</em>을 클릭해 주세요.
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

export async function getServerSideProps(context) {

    return {
        props: {},
    }
}