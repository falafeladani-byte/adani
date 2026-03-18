// ==========================================
// 🔔 SERVICE WORKER - פלאפל עדני
// ==========================================
// קובץ זה חייב להיות ממוקם בתיקיית השורש של האתר
// לצד index.html
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDDDqa7BMnCA5IDlAfTjKUvlDdHgapnJnM",
    authDomain: "falafel-adani.firebaseapp.com",
    projectId: "falafel-adani",
    storageBucket: "falafel-adani.firebasestorage.app",
    messagingSenderId: "319607616871",
    appId: "1:319607616871:web:68982636107da666262bc2"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    self.registration.showNotification(
        payload.notification?.title || 'פלאפל עדני - הזמנה חדשה! 🥙',
        {
            body: payload.notification?.body || 'הזמנה חדשה התקבלה!',
            icon: 'logo.jpg',
            vibrate: [200, 100, 200, 100, 200],
            requireInteraction: true,
            tag: 'new-order-' + Date.now()
        }
    );
});
const CACHE_NAME = 'falafel-adani-v1';

self.addEventListener('install', (event) => {
    console.log('[SW] Service Worker installed');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Service Worker activated');
    event.waitUntil(clients.claim());
});

// האזנה להודעות מהדף הראשי
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'NEW_ORDER') {
        const orderData = event.data.payload || {};
        
        const options = {
            body: orderData.body || 'הזמנה חדשה התקבלה! כנס ללוח להכין 🥙',
            icon: orderData.icon || 'logo.jpg',
            badge: orderData.badge || 'logo.jpg',
            vibrate: [200, 100, 200, 100, 200],
            tag: 'new-order-' + Date.now(), // מאפשר מספר הודעות במקביל
            requireInteraction: true, // ההודעה לא נעלמת עד שלוחצים עליה
            data: {
                url: orderData.url || '/',
                orderId: orderData.orderId || null,
                timestamp: Date.now()
            },
            actions: [
                {
                    action: 'open',
                    title: 'פתח לוח הזמנות',
                },
                {
                    action: 'dismiss',
                    title: 'סגור',
                }
            ]
        };

        event.waitUntil(
            self.registration.showNotification('פלאפל עדני - הזמנה חדשה! 🥙', options)
        );
    }
});

// FCM Push (אם מוגדר Firebase Cloud Messaging)
self.addEventListener('push', (event) => {
    console.log('[SW] Push received');
    
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch(e) {
        data = { body: event.data ? event.data.text() : 'הזמנה חדשה!' };
    }

    const options = {
        body: data.body || 'הזמנה חדשה התקבלה! כנס ללוח להכין 🥙',
        icon: data.icon || 'logo.jpg',
        badge: data.badge || 'logo.jpg',
        vibrate: [200, 100, 200, 100, 200],
        tag: 'new-order-push',
        requireInteraction: true,
        data: {
            url: data.url || '/',
        }
    };

    event.waitUntil(
        self.registration.showNotification('פלאפל עדני - הזמנה חדשה! 🥙', options)
    );
});

// לחיצה על ההתראה → פתיחת לוח הניהול
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event.action);
    event.notification.close();

    if (event.action === 'dismiss') return;

    const urlToOpen = (event.notification.data && event.notification.data.url) || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // אם כבר יש חלון פתוח — קפוץ אליו
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            // אחרת — פתח חלון חדש
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
