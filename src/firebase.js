// ─── DC.SPORTS ─── Firebase Utility ────────────────────────────────────────
// Fichier : src/firebase.js
// Importe ce fichier dans ton composant principal (dcsports-app.jsx)
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc, query, orderBy } from 'firebase/firestore';

// ─── Config Firebase ───────────────────────────────────────────────────────────
const firebaseConfig = {
    apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// ─── FCM : Initialisation ──────────────────────────────────────────────────────
export async function initFCM() {
    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return null;
        const messaging = getMessaging(app);
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        return token || null;
    } catch (e) {
        console.warn('[FCM] initFCM error:', e);
        return null;
    }
}

// ─── FCM : Écouter les messages en avant-plan ──────────────────────────────────
export function listenForegroundMessages(callback) {
    try {
        const messaging = getMessaging(app);
        onMessage(messaging, (payload) => {
            if (callback) callback(payload);
        });
    } catch (e) {
        console.warn('[FCM] listenForegroundMessages error:', e);
    }
}

// ─── Firestore : Token FCM Admin ───────────────────────────────────────────────
export async function saveAdminFcmToken(token) {
    try {
        await setDoc(doc(db, 'config', 'admin'), { fcmToken: token }, { merge: true });
    } catch (e) {
        console.error('[DB] saveAdminFcmToken error:', e);
    }
}

export async function getAdminFcmToken() {
    try {
        const snap = await getDoc(doc(db, 'config', 'admin'));
        return snap.exists() ? snap.data().fcmToken : null;
    } catch (e) {
        console.error('[DB] getAdminFcmToken error:', e);
        return null;
    }
}

// ─── Push Notifications ────────────────────────────────────────────────────────
export async function sendPushNotification({ token, title, body, data = {} }) {
    try {
        const res = await fetch('/api/send-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, title, body, data }),
        });
        const result = await res.json();
        return result;
    } catch (e) {
        console.error('[FCM] sendPushNotification error:', e);
        return null;
    }
}

export async function notifyAdmin({ adminFcmToken, order }) {
    if (!adminFcmToken) return;
    return sendPushNotification({
        token: adminFcmToken,
        title: '🏸 Nouvelle commande',
        body: `${order.userName} — ${order.string?.name || '?'} / ${order.racket}`,
        data: { orderId: order.id, type: 'new_order' },
    });
}

export async function notifyClient({ clientFcmToken, order }) {
    if (!clientFcmToken) return;
    return sendPushNotification({
        token: clientFcmToken,
        title: '✅ Votre cordage est prêt',
        body: `Votre raquette est prête à être récupérée !`,
        data: { orderId: order.id, type: 'order_ready' },
    });
}

// ─── Firestore : Sauvegarder un utilisateur ──────────────────────────────────
// Helper: transforme un email en identifiant Firestore valide
export function emailToDocId(email) {
    return email.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

export async function saveUser(user) {
    try {
        const docId = user.email ? emailToDocId(user.email) : (user.id || Date.now().toString());
        await setDoc(doc(db, 'users', docId), { ...user, id: docId }, { merge: true });
    }
    catch(e) { console.error('[DB] saveUser error:', e); }
}


export async function getUsers() {
    try {
        const snap = await getDocs(collection(db, 'users'));
        return snap.docs.map(d => d.data());
    } catch(e) { console.error('[DB] getUsers error:', e); return []; }
}


// ─── Firestore : Utilisateur par email (recherche directe par ID) ─────────────
export async function getUserByEmail(email) {
    try {
        const snap = await getDoc(doc(db, 'users', emailToDocId(email)));
        return snap.exists() ? snap.data() : null;
    } catch (e) {
        console.error('getUserByEmail error', e);
        return null;
    }
}


// ─── Firestore : Commandes ─────────────────────────────────────────────────
export async function saveOrder(order) {
    try {
        await setDoc(doc(db, 'orders', order.id), order, { merge: true });
    } catch(e) { console.error('[DB] saveOrder error:', e); }
}

export async function getOrders() {
    try {
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data());
    } catch {
        const snap = await getDocs(collection(db, 'orders'));
        return snap.docs.map(d => d.data());
    }
}

export async function updateOrder(orderId, updates) {
    try {
        await updateDoc(doc(db, 'orders', orderId), { ...updates, updatedAt: new Date().toISOString() });
    } catch(e) { console.error('[DB] updateOrder error:', e); }
}

// ─── EmailJS : Envoi d'email de réinitialisation ───────────────────────────────
export async function sendResetPasswordEmail({ toEmail, toName, newPassword }) {
    const serviceId  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            service_id:  serviceId,
            template_id: templateId,
            user_id:     publicKey,
            template_params: {
                to_email:     toEmail,
                to_name:      toName,
                new_password: newPassword,
            },
        }),
    });
    if (!res.ok) throw new Error('EmailJS error: ' + res.status);
    return res.text();
}
