// ─── DC.SPORTS — Firebase FCM Utility ────────────────────────────────────────
// Fichier : src/firebase.js
// Importe ce fichier dans ton composant principal (dcsports-app.jsx)
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// ⚠️ Remplace ces valeurs par ta config Firebase
// (Firebase Console → Ton projet → Paramètres → Général → Tes applications)
const firebaseConfig = {
  apiKey:            "REMPLACE_PAR_TON_API_KEY",
  authDomain:        "REMPLACE_PAR_TON_AUTH_DOMAIN",
  projectId:         "REMPLACE_PAR_TON_PROJECT_ID",
  storageBucket:     "REMPLACE_PAR_TON_STORAGE_BUCKET",
  messagingSenderId: "REMPLACE_PAR_TON_MESSAGING_SENDER_ID",
  appId:             "REMPLACE_PAR_TON_APP_ID",
};

// ⚠️ Ta clé VAPID publique
// (Firebase Console → Ton projet → Cloud Messaging → Certificats Web Push → Générer)
const VAPID_KEY = "REMPLACE_PAR_TA_VAPID_KEY";

// ── Init ─────────────────────────────────────────────────────────────────────
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// ── Demander la permission + récupérer le token FCM ─────────────────────────
export async function initFCM() {
  try {
    // 1. Demander la permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[FCM] Permission refusée');
      return null;
    }

    // 2. Enregistrer le service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    // 3. Obtenir le token FCM unique pour ce navigateur
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

// ── Écouter les messages quand l'app est au premier plan ─────────────────────
export function listenForegroundMessages(callback) {
  return onMessage(messaging, (payload) => {
    console.log('[FCM] Message premier plan :', payload);
    callback(payload);
  });
}

// ── Envoyer une notification via notre API Vercel ────────────────────────────
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

// Appelé quand le client soumet une commande → notifie l'admin
export async function notifyAdmin({ adminFcmToken, order }) {
  return sendPushNotification({
    token: adminFcmToken,
    title: '🏸 Nouvelle demande de cordage',
    body:  `${order.userName} — ${order.string.brand} ${order.string.name} · ${order.tension} lbs`,
    data:  { type: 'new_order', orderId: order.id, url: '/?page=admin' },
  });
}

// Appelé quand l'admin marque la raquette comme prête → notifie le client
export async function notifyClient({ clientFcmToken, order }) {
  return sendPushNotification({
    token: clientFcmToken,
    title: '✅ Votre raquette est prête !',
    body:  `${order.racket} — Venez la récupérer au magasin DC.SPORTS`,
    data:  { type: 'order_ready', orderId: order.id, url: '/?page=account' },
  });
}
