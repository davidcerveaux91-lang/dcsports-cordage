// ─── DC.SPORTS — API Push Notifications ──────────────────────────────────────
// Fichier : api/send-notification.js
// Vercel serverless function — déployé automatiquement avec ton projet
//
// ⚠️ Variables d'environnement à configurer dans Vercel Dashboard :
//    FIREBASE_SERVER_KEY  →  ta Server Key Firebase (Paramètres projet > Cloud Messaging)

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { token, title, body, data } = req.body;

  if (!token || !title || !body) {
    return res.status(400).json({ error: 'token, title et body sont requis' });
  }

  const serverKey = process.env.FIREBASE_SERVER_KEY;
  if (!serverKey) {
    return res.status(500).json({ error: 'FIREBASE_SERVER_KEY non configurée' });
  }

  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${serverKey}`,
      },
      body: JSON.stringify({
        to: token,
        notification: {
          title,
          body,
          icon:  '/icons/icon-192.png',
          badge: '/icons/icon-96.png',
          sound: 'default',
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
        data: data || {},
        priority: 'high',
      }),
    });

    const result = await response.json();

    if (result.failure > 0) {
      console.error('[FCM] Échec envoi :', result);
      return res.status(500).json({ error: 'Échec FCM', details: result });
    }

    return res.status(200).json({ success: true, messageId: result.results?.[0]?.message_id });
  } catch (err) {
    console.error('[FCM] Erreur serveur :', err);
    return res.status(500).json({ error: 'Erreur serveur', message: err.message });
  }
}
