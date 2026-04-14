// ─── DC.SPORTS — Firebase FCM Utility ────────────────────────────────────────
// Fichier : src/firebase.js
// Importe ce fichier dans ton composant principal (dcsports-app.jsx)
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// Firebase config – DCSPORTS-CORDAGE
const firebaseConfig = {
    apiKey:             import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain:         import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId:          import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket:      import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId:  import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId:              import.meta.env.VITE_FIREBASE_APP_ID,
};

// Clé VAPID publique (Firebase Console → Cloud Messaging → Certificats Web Push)
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// ── Init ─────────────────────────────────────────────────────────────────────
const app       = initializeApp(firebaseConfig);
const messaging = getMessaging(app);
const db        = getFirestore(app);

// ── Demander la permission + récupérer le token FCM ─────────────────────────
export async function initFCM() {
    try {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
                  console.warn('[FCM] Permission refusée');
                  return null;
          }
          const registration = await navigator.serviceWorker.ready;
          const token = await getToken(messaging, {
                  vapidKey: VAPID_KEY,
                  serviceWorkerRegistration: registration,
          });
          console.log('[FCM] Token obtenu :', token);
          return token;
    } catch (err) {
          console.error('[FCM] Erreur init :', err);
          return null;
    }
}

// ── Écouter les messages quand l'app est au premier plan ────────────────────
export function listenForegroundMessages(callback) {
    return onMessage(messaging, (payload) => {
          console.log('[FCM] Message premier plan :', payload);
          callback(payload);
    });
}

// ── Stocker / lire le token FCM admin dans Firestore ────────────────────────
// Permet à n'importe quel client (autre appareil) de notifier l'admin
export async function saveAdminFcmToken(token) {
    if (!token) return;
    try {
          await setDoc(
                  doc(db, 'config', 'admin'),
            { fcmToken: token, updatedAt: new Date().toISOString() },
            { merge: true }
                );
          console.log('[FCM] Token admin sauvegardé dans Firestore');
    } catch (err) {
          console.error('[FCM] Erreur sauvegarde token admin :', err);
    }
}

export async function getAdminFcmToken() {
    try {
          const snap = await getDoc(doc(db, 'config', 'admin'));
          if (snap.exists()) {
                  return snap.data().fcmToken || null;
          }
          return null;
    } catch (err) {
          console.error('[FCM] Erreur lecture token admin :', err);
          return null;
    }
}

// ── Envoyer une notification via notre API Vercel ───────────────────────────
export async function sendPushNotification({ token, title, body, data = {} }) {
    if (!token) return;
    try {
          const res = await fetch('/api/send-notification', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ token, title, body, data }),
          });
          if (!res.ok) {
                  const err = await res.json();
                  console.error('[Push] Erreur envoi :', err);
          }
    } catch (err) {
          console.error('[Push] Erreur réseau :', err);
    }
}

// ── Helpers prêts à l'emploi ─────────────────────────────────────────────────
export async function notifyAdmin({ adminFcmToken, order }) {
    return sendPushNotification({
          token: adminFcmToken,
          title: '🎾 Nouvelle demande de cordage',
          body:  `${order.userName} – ${order.string.brand} ${order.string.name} · ${order.tension} lbs`,
          data:  { type: 'new_order', orderId: order.id, url: '/?page=admin' },
    });
}

export async function notifyClient({ clientFcmToken, order }) {
    return sendPushNotification({
          token: clientFcmToken,
          title: '✅ Votre raquette est prête !',
          body:  `${order.racket} – Venez la récupérer au magasin DC.SPORTS`,
          data:  { type: 'order_ready', orderId: order.id, url: '/?page=account' },
    });
}
