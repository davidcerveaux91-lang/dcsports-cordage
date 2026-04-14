// âââ DC.SPORTS â Firebase FCM Utility ââââââââââââââââââââââââââââââââââââââââ
// Fichier : src/firebase.js
// Importe ce fichier dans ton composant principal (dcsports-app.jsx)
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// Firebase config â DCSPORTS-CORDAGE
const firebaseConfig = {
    apiKey:             import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain:         import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId:          import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket:      import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId:  import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId:              import.meta.env.VITE_FIREBASE_APP_ID,
};

// ClÃ© VAPID publique (Firebase Console â Cloud Messaging â Certificats Web Push)
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// ââ Init âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const app       = initializeApp(firebaseConfig);
const messaging = getMessaging(app);
const db        = getFirestore(app);

// ââ Demander la permission + rÃ©cupÃ©rer le token FCM âââââââââââââââââââââââââ
export async function initFCM() {
    try {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
                  console.warn('[FCM] Permission refusÃ©e');
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

// ââ Ãcouter les messages quand l'app est au premier plan ââââââââââââââââââââ
export function listenForegroundMessages(callback) {
    return onMessage(messaging, (payload) => {
          console.log('[FCM] Message premier plan :', payload);
          callback(payload);
    });
}

// ââ Stocker / lire le token FCM admin dans Firestore ââââââââââââââââââââââââ
// Permet Ã  n'importe quel client (autre appareil) de notifier l'admin
export async function saveAdminFcmToken(token) {
    if (!token) return;
    try {
          await setDoc(
                  doc(db, 'config', 'admin'),
            { fcmToken: token, updatedAt: new Date().toISOString() },
            { merge: true }
                );
          console.log('[FCM] Token admin sauvegardÃ© dans Firestore');
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

// ââ Envoyer une notification via notre API Vercel âââââââââââââââââââââââââââ
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
          console.error('[Push] Erreur rÃ©seau :', err);
    }
}

// ââ Helpers prÃªts Ã  l'emploi âââââââââââââââââââââââââââââââââââââââââââââââââ
export async function notifyAdmin({ adminFcmToken, order }) {
    return sendPushNotification({
          token: adminFcmToken,
          title: 'ð¾ Nouvelle demande de cordage',
          body:  `${order.userName} â ${order.string.brand} ${order.string.name} Â· ${order.tension} lbs`,
          data:  { type: 'new_order', orderId: order.id, url: '/?page=admin' },
    });
}

export async function notifyClient({ clientFcmToken, order }) {
    return sendPushNotification({
          token: clientFcmToken,
          title: 'â Votre raquette est prÃªte !',
          body:  `${order.racket} â Venez la rÃ©cupÃ©rer au magasin DC.SPORTS`,
          data:  { type: 'order_ready', orderId: order.id, url: '/?page=account' },
    });
}

// ââ RÃ©initialisation du mot de passe par email (EmailJS) âââââââââââââââââââââ
// Variables d'env requises : VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, VITE_EMAILJS_PUBLIC_KEY
export async function sendResetPasswordEmail({ toEmail, toName, newPassword }) {
  const serviceId  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    console.error('[EmailJS] Variables manquantes');
    throw new Error('EmailJS non configurÃ©');
  }

  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id:  serviceId,
      template_id: templateId,
      user_id:     publicKey,
      template_params: {
        to_email:     toEmail,
        to_name:      toName || toEmail,
        new_password: newPassword,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error('Ãchec envoi email : ' + text);
  }
  console.log('[EmailJS] Email envoyÃ© Ã ', toEmail);
}
}
