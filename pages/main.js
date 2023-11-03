import React, {useCallback, useEffect, useRef, useState} from "react";
import styles from "/styles/main.module.css"
import Image from "next/image";
import {useRouter} from "next/router";
import cmm from "../js/common";
import BtchList from "../components/btchListMain";
import BottomMenu from "../components/bottomMenu";
import Sheet from 'react-modal-sheet';

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
    const sheetRef = useRef();
    const sheetScrollRef = useRef();
    const [mapShopId, setMapShopId] = useState(null);
    const [mapOderUserId, setMapOderUserId] = useState(null);
    const [btchInfo, setBtchInfo] = useState({
        btchList: [],
        btchAcpList: [],
    });

    const createMap = data => {

        const container = document.getElementById('kakaoMap'); //지도를 담을 영역의 DOM 레퍼런스
        const shprLatLng = new kakao.maps.LatLng(data.shprPsitLot, data.shprPsitLat);
        const options = { //지도를 생성할 때 필요한 기본 옵션
            center: shprLatLng, //지도의 중심좌표.
            level: 5 //지도의 레벨(확대, 축소 정도)
        };

        const map = new kakao.maps.Map(container, options); //지도 생성 및 객체 리턴

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
            data.list.forEach(item => {

                // 마커 주소입니다 ODER_OPTM_DTC_SEQ
                let imageSrc = (item.ODER_PGRS_STAT === '02' || item.ODER_PGRS_STAT === '03') ? '/assets/images/icon/map/iconMapStore.png' : '/assets/images/icon/map/iconMapUser.png';

                if(!!item.ODER_OPTM_DTC_SEQ) {
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
                    // 마커 위에 인포윈도우를 표시합니다

                    // 배치 수락
                    if(item.ODER_PGRS_STAT === '02' || item.ODER_PGRS_STAT === '03') {

                        setMapShopId(item.SHOP_ID);
                        setMapOderUserId(null);
                    } else {

                        setMapShopId(null);
                        setMapOderUserId(item.ODER_USER_ID);
                    }

                    sheetRef.current.snapTo(0);
                });

                marker.setMap(map);
            });

            map.setBounds(bounds);
        }
    };

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

        if(!!document.querySelector('#ch-plugin')) {
            document.querySelector('#ch-plugin').classList.add('d-none');
        }

        return () => {
            if(!!document.querySelector('#ch-plugin')) {
                document.querySelector('#ch-plugin').classList.remove('d-none');
            }
        };
    }, []);

    /**
     * 배치 리스트 조회
     */
    const callBtchList = isInit => {
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
            setMapOderUserId(null);
            sheetScrollRef.current.scrollTop = 0;
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
    return (
        // <div className={styles.index} style={{height: windowHeight}}>
        <div className={styles.index + ' ' + dnone}>
            {(isEntApv && isDutjStrt) &&
                <>
                    <div className={styles.header}>
                        <Image alt={'로고'} src={'/assets/images/logoWhite.svg'} width={113.6} height={24.5} onClick={appTest} />
                        {/*<Link href={'/join/info'}>*/}
                        {/*    <span>{addr}<Image alt={'열기'} src={'/assets/images/icon/iconAllowDown.svg'} width={10.4} height={6} /></span>*/}
                        {/*</Link>*/}
                    </div>
                    <div id="kakaoMap" style={{height: 'calc(100% - 210px)'}}></div>
                    <Sheet ref={sheetRef} isOpen={isSheetOpen} className={'mainSheet'} onClose={() => setSheetOpen(false)} snapPoints={[window.innerHeight - 40, 155]} initialSnap={1}
                           onSnap={sheetSnapHandler}>
                        <Sheet.Container>
                            <Sheet.Header></Sheet.Header>
                            <Sheet.Content>
                                <Sheet.Scroller ref={sheetScrollRef} className={snapIdx === 1 ? 'noScroll' : ''}>
                                    {!mapShopId && !mapOderUserId &&
                                        <div className={'tabArea'}>
                                            <div>
                                                <button className={'button ' + (tabIdx === 0 ? 'on' : '')} onClick={() => setTabIdx(0)}>모든 배치 {btchInfo.btchList.length}</button>
                                                <button className={'button ' + (tabIdx === 0 ? '' : 'on')} onClick={() => setTabIdx(1)}>진행중 배치 {btchInfo.btchAcpList.length}</button>
                                            </div>
                                        </div>
                                    }
                                    <div className={'btchArea' + ' ' +  (tabIdx === 0 ? '' : 'ing') + ' '}>
                                        <BtchList list={btchInfo.btchList} href={'/btch'} filter={tabIdx === 0 ? {mapShopId, mapOderUserId} : null} isInit={isInit} reflashHandler={() => callBtchList()} />
                                        <BtchList list={btchInfo.btchAcpList} href={'/btch/ing'} filter={tabIdx === 1 ? {mapShopId, mapOderUserId} : null} isInit={isInit} noDataTxt={'현재 수락한 배치가 없습니다.'} isIngBtch={true} reflashHandler={() => callBtchList()} />
                                    </div>
                                </Sheet.Scroller>
                            </Sheet.Content>
                        </Sheet.Container>
                    </Sheet>
                    {isDtcOptmBtn &&
                        <button className={styles.btnOptm} onClick={dtcOptmHandler}>
                            <Image src={'/assets/images/icon/iconDistance.svg'} width={24} height={15} alt={'동선최적화'}></Image>
                            동선최적화
                        </button>
                    }
                    <div className={styles.refresh} onClick={() => callBtchList()}>
                        <Image src={'/assets/images/icon/iconRefresh.svg'} alt={'새로고침'} width={18.5} height={18.5} />
                        <span>새로고침</span>
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
                            <p>
                            순차적으로 승인 진행중에 있으니<br/>
                            조금만 더 기다려주시기 바랍니다.
                            </p>
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