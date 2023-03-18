import '../styles/globals.css'
import '../public/assets/css/blueimp-gallery.min.css';
import {GlobalProvider} from "../context/globalContext";
import CmmComponent from "../components/cmmComponent";
import {useEffect} from "react";
import firebaseInit from "../js/firebase";

export default function MyApp({ Component, pageProps }) {

    useEffect(() => {

        if(!!("Notification" in window)) {
            firebaseInit();
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
