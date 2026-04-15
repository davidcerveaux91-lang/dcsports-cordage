// âââ DC.SPORTS âââ Firebase Utility ââââââââââââââââââââââââââââââââââââââââ
// Fichier : src/firebase.js
// Importe ce fichier dans ton composant principal (dcsports-app.jsx)
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';

// âââ Config Firebase âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
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

// âââ FCM : Initialisation ââââââââââââââââââââââââââââââââââââââââââââââââââââââ
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

// âââ FCM : Ãcouter les messages en avant-plan ââââââââââââââââââââââââââââââââââ
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

// âââ Firestore : Token FCM Admin âââââââââââââââââââââââââââââââââââââââââââââââ
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

// âââ Push Notifications ââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
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
        title: 'ð¸ Nouvelle commande',
        body: `${order.userName} â ${order.string?.name || '?'} / ${order.racket}`,
        data: { orderId: order.id, type: 'new_order' },
    });
}

export async function notifyClient({ clientFcmToken, order, title, body }) {
    if (!clientFcmToken) return;
    const notifTitle = title || '✅ Votre cordage est prêt';
    const notifBody = body || `Votre raquette est prête à être récupérée !`;
    return sendPushNotification({
        token: clientFcmToken,
        title: notifTitle,
        body: notifBody,
        data: { orderId: order.id, type: 'order_update' },
    });
}

// âââ Firestore : Sauvegarder un utilisateur ââââââââââââââââââââââââââââââââââ
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


// âââ Firestore : Utilisateur par email (recherche directe par ID) âââââââââââââ
export async function getUserByEmail(email) {
    try {
        const snap = await getDoc(doc(db, 'users', emailToDocId(email)));
        return snap.exists() ? snap.data() : null;
    } catch (e) {
        console.error('getUserByEmail error', e);
        return null;
    }
}


// âââ Firestore : Commandes âââââââââââââââââââââââââââââââââââââââââââââââââ
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

// âââ EmailJS : Envoi d'email de rÃ©initialisation âââââââââââââââââââââââââââââââ
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

// Supprimer une commande
export async function deleteOrder(orderId) {
    try {
        await deleteDoc(doc(db, 'orders', orderId));
    } catch(e) { console.error('[DB] deleteOrder error:', e); }
}
