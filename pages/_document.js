import { Html, Head, Main, NextScript } from 'next/document'
import {useState} from "react";

export default function Document() {

  return (
    <Html lang="en">
      <Head >
          <link rel="shortcut icon" href="/assets/images/logo.svg" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
