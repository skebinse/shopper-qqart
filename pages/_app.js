import '../styles/globals.css'
import '../public/assets/css/blueimp-gallery.min.css';
import {GlobalProvider} from "../context/globalContext";
import CmmComponent from "../components/cmmComponent";
import {useEffect} from "react";
import firebaseInit from "../js/firebase";
import cmm from "../js/common";

export default function MyApp({ Component, pageProps }) {

    useEffect(() => {

        if(!!("Notification" in window)) {
            // firebaseInit();
        }

        // 리액트 네이티브일 경우
        if(cmm.isReactApp()) {

            // 앱 콜백
            const appCallback = e => {

                const result = JSON.parse(e.data);

                // PUSH Key
                if(result.type === cmm.Cont.APP_MESSAGE_TYPE.ONE_SIGNAL_PLAYER_ID) {

                    if(!!result.data) {

                        const token = result.data.replace(/\"/g, '');

                        // 토큰 정보가 다를 경우
                        if(cmm.util.getLs(cmm.Cont.APP_TOKEN) !== token) {

                            cmm.ajax({
                                url: '/api/cmm/modAppPushTkn',
                                isLoaing: false,
                                data: {
                                    token
                                },
                                success: res => {},
                                error: res => {}
                            });
                        }

                        cmm.util.setLs(cmm.Cont.APP_TOKEN, token);
                    }
                // PUSH
                } else if(result.type === cmm.Cont.APP_MESSAGE_TYPE.NOTIFICATION) {

                    // 로그인 시
                    if(cmm.checkLogin()) {

                        const json = JSON.parse(result.data);

                        webPushTit.innerHTML = json.title;
                        webPushTxt.innerHTML = json.body;

                        if (!!json.additionalData && !!json.additionalData.custom_url) {

                            btnWebPushUrl.classList = '';
                            btnWebPushUrl.setAttribute('data-url', json.additionalData.custom_url);
                        } else {

                            btnWebPushUrl.classList = 'd-none';
                        }

                        document.querySelector('.webPushDiv').classList = 'webPushDiv active';
                    }
                // 앱버전
                } else if(result.type === cmm.Cont.APP_MESSAGE_TYPE.CURRENT_APP_VERSION) {

                    const json = JSON.parse(result.data);
                    // cmm.alert(json.os + ' ' + json.version);
                }
            };

            // 앱 안드로이드일 경우
            if(cmm.app.isAndroid()) {

                document.addEventListener("message", e => {

                    // 앱 콜백
                    appCallback(e);
                });
            } else {

                window.addEventListener("message", e => {

                    // 앱 콜백
                    appCallback(e);
                });
            }

            // 앱버전 호출
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: cmm.Cont.APP_MESSAGE_TYPE.CURRENT_APP_VERSION
            }));

            // PUSH key 호출
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: cmm.Cont.APP_MESSAGE_TYPE.ONE_SIGNAL_PLAYER_ID
            }));
        }

        // 채널톡
        cmm.plugin.channelIO();

        // PUSH
        window.onPushMessage = data => {

            // 로그인 시
            if(cmm.checkLogin()) {

                if(data.notification.additionalData.type === 'NOTICE') {

                    // 업체가 아닐경우
                    if(cmm.getLoginInfo('SHPR_GRD_CD') !== 'ETPS') {

                        // 게시판 상세 조회
                        cmm.ajax({
                            url: `/api${data.notification.additionalData.custom_url.replace('annc/', 'anncs/')}`,
                            success: res => {

                                webPushNoticeTit.innerHTML = res.BBAD_KD;
                                webPushNoticeTxt.innerHTML = res.BBAD_TEXT;
                                webPushNoticeTxt.style.maxHeight = (window.innerHeight - 200) + 'px'

                                document.querySelector('.webPushDiv.notice').classList = 'webPushDiv notice active';
                            }
                        });
                    }
                } else {

                    webPushTit.innerHTML = data.notification.title;
                    webPushTxt.innerHTML = data.notification.body;
                    if(!!data.notification.additionalData && !!data.notification.additionalData.custom_url) {

                        btnWebPushUrl.classList = '';
                        btnWebPushUrl.setAttribute('data-url', data.notification.additionalData.custom_url);
                    } else {

                        btnWebPushUrl.classList = 'd-none';
                    }

                    document.querySelector('.webPushDiv.message').classList = 'webPushDiv message active';
                }
            }
        };

        // PUSH 토큰 가져오기
        window.getPushToken = token => {

            if(!token) {

                // PUSH Token
                cmm.app.getPushToken();
            } else {

                if(cmm.checkLogin()) {

                    // 토큰 정보가 다를 경우
                    if(cmm.util.getLs(cmm.Cont.APP_TOKEN) !== token) {

                        cmm.ajax({
                            url: '/api/cmm/modAppPushTkn',
                            isLoaing: false,
                            data: {
                                token
                            },
                            success: res => {},
                            error: res => {}
                        });
                    }
                }

                cmm.util.setLs(cmm.Cont.APP_TOKEN, token);
            }
        };

        // 좌표 호출(앱에서 자동으로 호출: 사용안함)
        window.call_position = () => {
        };

        // 앱이고 토큰 정보가 스토리지에 없는 경우
        if(cmm.isApp()) {

            if(!!localStorage.pushid) {

                cmm.util.setLs(cmm.Cont.APP_TOKEN, localStorage.pushid);
            }

            // PUSH Token
            cmm.app.getPushToken();
        }

        // 현재 위치
        window.getPsPsit = (lat, lot) => {

            // 로그인 시
            if(cmm.checkLogin()) {

                // 쇼퍼 현재 위치
                cmm.util.setLs(cmm.Cont.SHPR_PS_PSIT, {
                    shprPsitLat: lot,
                    shprPsitLot: lat
                });

                cmm.ajax({
                    url: '/api/cmm/insPsPsit',
                    isLoaing: false,
                    data: {
                        lat,
                        lot,
                        shprAppYn: 'Y',
                    },
                    success: res => {},
                    error: res => {}
                });
            }
        };

        setTimeout(() => {

            // 앱일 경우 현재 위치 저장
            if (cmm.isApp()) {

                window.webkit.messageHandlers.cordova_iab.postMessage(JSON.stringify({
                    "action": "getlocation",
                    "callback": "window.getPsPsit"
                }));

                // 2분마다 실행
                setInterval(() => {

                    window.webkit.messageHandlers.cordova_iab.postMessage(JSON.stringify({
                        "action": "getlocation",
                        "callback": "window.getPsPsit"
                    }));
                }, (1000 * 60 * 2));
            } else {

                // 위치 정보
                // if(!!navigator.geolocation && !!navigator.geolocation.getCurrentPosition) {
                //
                //     // 현재 위치 저장
                //     const callCurrentPosition = () => {
                //
                //         // 로그인 시
                //         if(cmm.checkLogin()) {
                //             navigator.geolocation.getCurrentPosition(res => {
                //
                //                 cmm.ajax({
                //                     url: '/api/cmm/insPsPsit',
                //                     isLoaing: false,
                //                     data: {
                //                         lat: res.coords.latitude,
                //                         lot: res.coords.longitude,
                //                         shprAppYn: 'N',
                //                     },
                //                     success: res => {
                //                     },
                //                     error: res => {
                //                     }
                //                 });
                //             }, res => console.error(res))
                //         }
                //     };
                //
                //     // 현재 위치 저장
                //     callCurrentPosition();
                //
                //     // 2분마다 실행
                //     setInterval(() => {
                //
                //         // 현재 위치 저장
                //         callCurrentPosition();
                //     }, (1000 * 60 * 2));
                // }
            }
        }, 1000);

        if(process.env.NEXT_PUBLIC_RUN_MODE !== 'prod') {

            window.onerror = function(msg,file,line) {

                alert("오류메세지\t"+msg+"\n"+"파일위치\t"+file+"\n"+"라인번호\t"+line);

                return false;  //true를 return하면 오류메세지를 발생시키지 않음
            }
        } else {

            window.onerror = function(msg,file,line) {

                // DB에 로그 남기기
                cmm.insDbLog('스크립트 오류', `화면: ${location.href} 오류메세지 : ${msg} 파일위치 : ${file} 라인번호 : ${line}`);
            }
        }

    }, []);

  return (
    <GlobalProvider>
      <Component {...pageProps} />
      <CmmComponent />
    </GlobalProvider>
  );
}

// MyApp.getInitialProps = async (appContext) => {
//
//   // calls page's `getInitialProps` and fills `appProps.pageProps`
//   const appProps = await App.getInitialProps(appContext);
//
//   //userAgent
//   const userAgent = await appContext.ctx.req ? appContext.ctx.req?.headers['user-agent'] : navigator.userAgent
//
//   //Mobile
//   const mobile = await userAgent?.indexOf('Mobi')
//
//   //Mobile in pageProps
//   appProps.pageProps.isMobile = await (mobile !== -1) ? true : false;
//
//   return { ...appProps }
// }
