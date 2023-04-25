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
            firebaseInit();
        }

        window.onPushMessage = data => {

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

        window.getPushToken = token => {

            cmm.alert('token : ' + token)
            cmm.util.setLs(cmm.Cont.APP_TOKEN, token);
        }
cmm.alert('cmm.isApp() : ' + cmm.isApp())
cmm.alert('cmm.util.getLs(cmm.Cont.APP_TOKEN) : ' + cmm.util.getLs(cmm.Cont.APP_TOKEN))
        if(cmm.isApp() && !cmm.util.getLs(cmm.Cont.APP_TOKEN)) {

            // PUSH Token
            cmm.app.getPushToken();
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
