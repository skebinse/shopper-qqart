import { Html, Head, Main, NextScript } from 'next/document'
import {useState} from "react";

export default function Document() {

  return (
    <Html lang="en">
      <Head >
          <link rel="shortcut icon" href="/assets/images/logo.svg" />
          <script src="//dapi.kakao.com/v2/maps/sdk.js?appkey=dc6e9cd5281395107b6f48fbdf3b0ab1&libraries=services"></script>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
