// ─── DC.SPORTS ─── Firebase Utility ───────────────────────────────────────
// Fichier : src/firebase.js
// Importe ce fichier dans ton composant principal (dcsports-app.jsx)
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc, query, orderBy, where } from 'firebase/firestore';

// Firebase config ─── DCSPORTS-CORDAGE
const firebaseConfig = {
    apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);
let messaging = null;
try { messaging = getMessaging(app); } catch(e) { console.warn('[FCM] Messaging non disponible:', e.message); }

// ─── FCM init ─────────────────────────────────────────────────────────────
export async function initFCM() {
    if (!messaging) return null;
    try {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') return null;
        const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: await navigator.serviceWorker.ready,
        });
        return token || null;
    } catch(e) { console.warn('[FCM] initFCM error:', e.message); return null; }
}

export function listenForegroundMessages(callback) {
    if (!messaging) return;
    onMessage(messaging, payload => {
        callback({
            title: payload.notification?.title || 'DC.SPORTS',
            body:  payload.notification?.body  || '',
            data:  payload.data || {},
        });
    });
}

// ─── Admin FCM token ───────────────────────────────────────────────────────
export async function saveAdminFcmToken(token) {
    if (!token) return;
    try {
        await setDoc(doc(db, 'config', 'admin'), { fcmToken: token, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) { console.error('[FCM] Erreur sauvegarde token admin :', err); }
}

export async function getAdminFcmToken() {
    try {
        const snap = await getDoc(doc(db, 'config', 'admin'));
        if (snap.exists()) return snap.data().fcmToken || null;
    } catch(e) { console.warn('[FCM] getAdminFcmToken error:', e); }
    return null;
}

// ─── Push notification ─────────────────────────────────────────────────────
export async function sendPushNotification({ token, title, body, data = {} }) {
    if (!token) return;
    try {
        const res = await fetch('/api/send-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, title, body, data }),
        });
        if (!res.ok) console.warn('[FCM] sendPush HTTP error:', res.status);
    } catch(e) { console.warn('[FCM] sendPush fetch error:', e); }
}

export async function notifyAdmin({ adminFcmToken, order }) {
    return sendPushNotification({
        token: adminFcmToken,
        title: 'Nouvelle demande de cordage',
        body:  order.userName + ' - ' + order.string.brand + ' ' + order.string.name + ' - ' + order.tension + ' lbs',
        data:  { type: 'new_order', orderId: order.id, url: '/?page=admin' },
    });
}

export async function notifyClient({ clientFcmToken, order }) {
    return sendPushNotification({
        token: clientFcmToken,
        title: 'Votre raquette est prete !',
        body:  order.string.brand + ' ' + order.string.name + ' - ' + order.racket,
        data:  { type: 'order_ready', orderId: order.id, url: '/?page=account' },
    });
}

// ─── Firestore : Utilisateurs ──────────────────────────────────────────────
export async function saveUser(user) {
    try { await setDoc(doc(db, 'users', user.id), user, { merge: true }); }
    catch(e) { console.error('[DB] saveUser error:', e); }
}

export async function getUsers() {
    try {
        const snap = await getDocs(collection(db, 'users'));
        return snap.docs.map(d => d.data());
    } catch(e) { console.error('[DB] getUsers error:', e); return []; }
}

// ─── Firestore : Utilisateur par email ────────────────────────────────────────
export async function getUserByEmail(email) {
    try {
        const q = query(collection(db, 'users'), where('email', '==', email));
        const snap = await getDocs(q);
        if (snap.empty) return null;
        return snap.docs[0].data();
    } catch (e) {
        console.error('getUserByEmail error', e);
        return null;
    }
}

// ─── Firestore : Commandes ─────────────────────────────────────────────────
export async function saveOrder(order) {
    try { await setDoc(doc(db, 'orders', order.id), order, { merge: true }); }
    catch(e) { console.error('[DB] saveOrder error:', e); }
}

export async function getOrders() {
    try {
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data());
    } catch(e) {
        try {
            const snap = await getDocs(collection(db, 'orders'));
            return snap.docs.map(d => d.data());
        } catch(e2) { return []; }
    }
}

export async function updateOrder(orderId, updates) {
    try { await updateDoc(doc(db, 'orders', orderId), updates); }
    catch(e) { console.error('[DB] updateOrder error:', e); }
}

// ─── EmailJS : Mot de passe oublie ────────────────────────────────────────
export async function sendResetPasswordEmail({ toEmail, toName, newPassword }) {
    const serviceId  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
    const payload = {
        service_id:  serviceId,
        template_id: templateId,
        user_id:     publicKey,
        template_params: { to_email: toEmail, to_name: toName, new_password: newPassword },
    };
    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('EmailJS error: ' + res.status);
}
