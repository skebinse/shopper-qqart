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
                        const topic = process.env.NEXT_PUBLIC_RUN_MODE;

                        fetch(`https://iid.googleapis.com/iid/v1/${currentToken}/rel/topics/${topic}shopper`, {
                            method: 'POST',
                            headers: new Headers({
                                'Authorization': 'key=AAAAuBa2I_o:APA91bH_7Qw0NrVmAORWB-VebcFbzVy9D_A5SHnGj3tO6rT9n2pKyuO_ZleUCWNiHCIK_6mqZSZcbCK8w9UJz8h19O7YS2GWCiqt0pUD-gcgCV9e26uFggFh_6ZYjILT8bZcv3qZmsjT'
                            })
                        }).then(response => {
                            if (response.status < 200 || response.status >= 400) {
                                throw 'Error subscribing to topic: '+response.status + ' - ' + response.text();
                            }
                        }).catch(error => {
                            console.error(error);
                        });
                    }
                });
            }
        });
    }
}