const clients = {};

export default function handler(req, res) {
  const { tel, action, nom } = req.query;
  const key = tel?.replace(/\s/g, '');
  
  if (!key) return res.status(400).json({ error: 'Téléphone requis' });

  // Nouveau client
  if (!clients[key]) {
    clients[key] = { nom: nom || 'Client', cordages: 0 };
  }

  // Nouvelle commande
  if (action === 'commander') {
    const estCadeau = clients[key].cordages % 5 === 4;
    clients[key].cordages++;
    
    return res.json({
      cordages: clients[key].cordages,
      estCadeau,
      prix: estCadeau ? 0 : 25,
      message: estCadeau ? '🎁 5ème cordage OFFERT !' : `Commande #${clients[key].cordages} enregistrée`
    });
  }

  // Lire infos client
  const prochain = 5 - (clients[key].cordages % 5);
  
  res.json({
    nom: clients[key].nom,
    cordages: clients[key].cordages,
    cadeauDisponible: clients[key].cordages % 5 === 4,
    prochainCadeau: prochain === 5 ? 0 : prochain
  });
}
