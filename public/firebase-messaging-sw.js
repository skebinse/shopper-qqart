importScripts('https://www.gstatic.com/firebasejs/9.17.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/9.17.1/firebase-messaging-compat.js')

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
    apiKey: "AIzaSyAiLcJ3nwiOk0uD1lsQOLzOxqeVAsmP1Bo",
    authDomain: "shopper-qqcart.firebaseapp.com",
    projectId: "shopper-qqcart",
    storageBucket: "shopper-qqcart.appspot.com",
    messagingSenderId: "790655017978",
    appId: "1:790655017978:web:919ca670cd41e388a93a43",
    measurementId: "G-BQBNX2BV7K"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

const notiClick = e => {

    console.log(e);
    e.notification.close();
    if(!!e.notification.data && !!e.notification.data.FCM_MSG && !!e.notification.data.FCM_MSG.data
        && !!e.notification.data.FCM_MSG.data['gcm.notification.data']) {

        self.clients.openWindow(JSON.parse(e.notification.data.FCM_MSG.data['gcm.notification.data']).url);
    } else if(e.notification.data.indexOf('url') > -1) {

        self.clients.openWindow(JSON.parse(e.notification.data).url);
    }
};

self.removeEventListener('notificationclick', notiClick);
self.addEventListener('notificationclick', notiClick);

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Customize notification here
    const notificationOptions = {
        body: payload.notification.body,
        icon: payload.notification.icon,
        data: payload.data['gcm.notification.data'],
    };

    self.registration.showNotification(payload.notification.title,
        notificationOptions);
});