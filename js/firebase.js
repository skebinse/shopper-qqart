// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import cmm from "./common";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAiLcJ3nwiOk0uD1lsQOLzOxqeVAsmP1Bo",
    authDomain: "shopper-qqcart.firebaseapp.com",
    projectId: "shopper-qqcart",
    storageBucket: "shopper-qqcart.appspot.com",
    messagingSenderId: "790655017978",
    appId: "1:790655017978:web:919ca670cd41e388a93a43",
    measurementId: "G-BQBNX2BV7K"
};

export default function firebaseInit() {

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const messaging = getMessaging(app);

    // 로그인 시
    if(cmm.checkLogin()) {

        Notification.requestPermission().then(permission => {

            if(permission === "granted") {

                onMessage(messaging, (payload) => {

                    webPushTxt.innerHTML = payload.notification.body;
                    if(!!payload.data['gcm.notification.data']) {

                        webPushHref.href = JSON.parse(payload.data['gcm.notification.data']).url;
                        webPushHref.innerHTML = '이동하기';
                    }

                    document.querySelector('.webPushDiv').classList = 'webPushDiv active';
                });

                // Add the public key generated from the console here.
                getToken(messaging, {vapidKey: "BPrQVEMHYrZCPPF6XcLuu9PndSSjIT5vl2NipATimwypkorjogyDooorUOkBdxOBzyJFVSyKMfBRbeGFmjQIcpQ"}).then((currentToken) => {

                    if(cmm.util.getLs(cmm.Cont.WEB_TOKEN) !== currentToken) {

                        cmm.ajax({
                            url: '/api/cmm/modWebPushTkn',
                            data: {
                                webPushTkn: currentToken
                            },
                            success: res => {

                                cmm.util.setLs(cmm.Cont.WEB_TOKEN, currentToken);
                            }
                        });
                        // 토픽(`${RUN_MODE}shopper`) 구독은 FCM 서버키가 필요하므로 클라이언트에서 하지 않는다.
                        // 웹푸시 재사용 시 서버 API 에서 구독 처리할 것 (firebaseInit 은 현재 _app.js 에서 미사용)
                    }
                });
            }
        });
    }
}