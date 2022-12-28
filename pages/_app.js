import '../styles/globals.css'
import App from "next/app";
import {GlobalProvider} from "../context/globalContext";
import CmmComponent from "../components/cmmComponent";

export default function MyApp({ Component, pageProps }) {

  return (
    <GlobalProvider>
      <Component {...pageProps} />
      <CmmComponent />
    </GlobalProvider>
  );
}

MyApp.getInitialProps = async (appContext) => {

  // calls page's `getInitialProps` and fills `appProps.pageProps`
  const appProps = await App.getInitialProps(appContext);

  //userAgent
  const userAgent = await appContext.ctx.req ? appContext.ctx.req?.headers['user-agent'] : navigator.userAgent

  //Mobile
  const mobile = await userAgent?.indexOf('Mobi')

  //Mobile in pageProps
  appProps.pageProps.isMobile = await (mobile !== -1) ? true : false;

  return { ...appProps }
}
