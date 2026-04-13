// ─── DC.SPORTS — API Push Notifications (FCM V1) ─────────────────────────────
// Fichier : api/send-notification.js
// Vercel serverless function — déployé automatiquement avec ton projet
//
// ⚠️ Variables d'environnement à configurer dans Vercel Dashboard :
//    FIREBASE_SERVICE_ACCOUNT  →  le contenu JSON de ta clé de compte de service Firebase
//                                 (Firebase Console > Paramètres > Comptes de service > Générer clé privée)

import { SignJWT, importPKCS8 } from 'jose';

async function getAccessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const privateKey = await importPKCS8(serviceAccount.private_key, 'RS256');

  const jwt = await new SignJWT({
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .sign(privateKey);

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const data = await res.json();
  if (!data.access_token) {
    throw new Error('Impossible d\'obtenir le token: ' + JSON.stringify(data));
  }
  return data.access_token;
}

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

  const serviceAccountJSON = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountJSON) {
    return res.status(500).json({ error: 'FIREBASE_SERVICE_ACCOUNT non configurée' });
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountJSON);
  } catch (e) {
    return res.status(500).json({ error: 'FIREBASE_SERVICE_ACCOUNT invalide (pas du JSON valide)' });
  }

  try {
    const accessToken = await getAccessToken(serviceAccount);
    const projectId = serviceAccount.project_id;

    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: {
            token,
            notification: {
              title,
              body,
            },
            webpush: {
              notification: {
                icon: '/icons/icon-192.png',
                badge: '/icons/icon-96.png',
                sound: 'default',
              },
              fcm_options: {
                link: data?.url || '/',
              },
            },
            data: data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) : {},
          },
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('[FCM V1] Échec envoi :', result);
      return res.status(500).json({ error: 'Échec FCM', details: result });
    }

    return res.status(200).json({ success: true, messageId: result.name });
  } catch (err) {
    console.error('[FCM V1] Erreur serveur :', err);
    return res.status(500).json({ error: 'Erreur serveur', message: err.message });
  }
}
