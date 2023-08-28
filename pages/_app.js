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

        // 채널톡
        cmm.plugin.channelIO();

        // PUSH
        window.onPushMessage = data => {

            // 로그인 시
            if(cmm.checkLogin()) {

                webPushTit.innerHTML = data.notification.title;
                webPushTxt.innerHTML = data.notification.body;
                if(!!data.notification.additionalData && !!data.notification.additionalData.custom_url) {

                    btnWebPushUrl.classList = '';
                    btnWebPushUrl.setAttribute('data-url', data.notification.additionalData.custom_url);
                } else {

                    btnWebPushUrl.classList = 'd-none';
                }
                document.querySelector('.webPushDiv').classList = 'webPushDiv active';
            }
        };

        // PUSH 토큰 가져오기
        window.getPushToken = token => {

            cmm.util.setLs(cmm.Cont.APP_TOKEN, token);
        }

        // 앱이고 토큰 정보가 스토리지에 없는 경우
        if(cmm.isApp() && !cmm.util.getLs(cmm.Cont.APP_TOKEN)) {

            // PUSH Token
            cmm.app.getPushToken();
        }

        // 현재 위치
        window.getPsPsit = (lat, lot) => {

            // 로그인 시
            if(cmm.checkLogin()) {

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

                webkit.messageHandlers.cordova_iab.postMessage(JSON.stringify({
                    "action": "getlocation",
                    "callback": "window.getPsPsit"
                }));

                // 2분마다 실행
                setInterval(() => {

                    webkit.messageHandlers.cordova_iab.postMessage(JSON.stringify({
                        "action": "getlocation",
                        "callback": "window.getPsPsit"
                    }));
                }, (1000 * 60 * 2));
            } else {

                // // 위치 정보
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

                return true;  //true를 return하면 오류메세지를 발생시키지 않음
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
