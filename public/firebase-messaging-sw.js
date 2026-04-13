// ─── DC.SPORTS — Firebase Messaging Service Worker ───────────────────────────
// Fichier : public/firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Firebase config – DCSPORTS-CORDAGE
firebase.initializeApp({
  apiKey:            "AIzaSyBdZ3oMf3eP60Q3TbWiltW1O2vc6yoWwag",
  authDomain:        "dcsports-cordage.firebaseapp.com",
  projectId:         "dcsports-cordage",
  storageBucket:     "dcsports-cordage.firebasestorage.app",
  messagingSenderId: "424771279256",
  appId:             "1:424771279256:web:274b4ae31396e396ebf3ed",
});

const messaging = firebase.messaging();

// ── Notification reçue en arrière-plan ──────────────────────────────────────
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Notification en arrière-plan reçue :', payload);

  const { title, body, icon, data } = payload.notification || {};

  self.registration.showNotification(title || 'DC.SPORTS', {
    body:    body  || 'Vous avez une mise à jour.',
    icon:    icon  || '/icons/icon-192.png',
    badge:        '/icons/icon-96.png',
    vibrate:      [200, 100, 200],
    tag:          data?.orderId || 'dcsports-notif',
    renotify:     true,
    data:         data || {},
    actions: [
      { action: 'open', title: '🏸 Voir' },
      { action: 'close', title: 'Fermer' },
    ],
  });
});

// ── Clic sur la notification → ouvre l'app ──────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// ── Cache PWA basique (offline) ──────────────────────────────────────────────
const CACHE_NAME = 'dcsports-v1';
const ASSETS_TO_CACHE = ['/', '/index.html', '/manifest.json', '/icons/icon-192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
