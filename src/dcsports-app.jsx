import { useState, useEffect } from "react";
import { Clock, MapPin, LogOut, CheckCircle, Package, AlertCircle, User, X } from "lucide-react";
import { initFCM, listenForegroundMessages, notifyAdmin, notifyClient, saveAdminFcmToken, getAdminFcmToken, sendResetPasswordEmail, saveUser, getUsers, getUserByEmail, saveOrder, getOrders, updateOrder, deleteOrder } from './firebase';

let _adminClicks = 0;

// ─── CATALOG DATA ─────────────────────────────────────────────────────────────

const STRINGS = [
  // ── YONEX ──
  { id:"bg65", brand:"Yonex", name:"BG65", price:21, gauge:"0.70mm", type:"Multifilament",
    colors:[{id:"blanc",name:"Blanc",hex:"#F0F0F0"},{id:"jaune",name:"Jaune",hex:"#FFD700"},{id:"bleu",name:"Bleu ciel",hex:"#00BFFF"}],
    profile:{durabilite:95,controle:70,vitesse:60,puissance:65,feeling:70}, tension:{min:9,max:17,rec:13},
    description:"Le cordage le plus vendu au monde. Polyvalence et durabilité exceptionnelles. Idéal pour les joueurs réguliers qui veulent un cordage fiable.",
    bestFor:["Débutants","Intermédiaires","Joueurs loisir"] },
  { id:"bg65ti", brand:"Yonex", name:"BG65 Ti", price:21, gauge:"0.70mm", type:"Multifilament",
    colors:[{id:"blanc",name:"Blanc",hex:"#F0F0F0"},{id:"jaune",name:"Jaune",hex:"#FFD700"}],
    profile:{durabilite:92,controle:72,vitesse:65,puissance:78,feeling:72}, tension:{min:9,max:17,rec:13},
    description:"Version titanisée du BG65. Le revêtement titane augmente la puissance et la durabilité tout en gardant la polyvalence du BG65.",
    bestFor:["Intermédiaires","Puissance","Durabilité"] },
  { id:"bg80", brand:"Yonex", name:"BG80", price:21, gauge:"0.68mm", type:"Multifilament",
    colors:[{id:"blanc",name:"Blanc",hex:"#F0F0F0"},{id:"jaune",name:"Jaune",hex:"#FFD700"},{id:"bleu",name:"Bleu",hex:"#1E90FF"}],
    profile:{durabilite:70,controle:90,vitesse:75,puissance:75,feeling:85}, tension:{min:9,max:17,rec:14},
    description:"Excellent contrôle et feeling précis. Très apprécié en double. Son crisp et réponse tactile remarquable.",
    bestFor:["Confirmés","Double","Techniciens"] },
  { id:"bg80power", brand:"Yonex", name:"BG80 Power", price:21, gauge:"0.68mm", type:"Multifilament",
    colors:[{id:"blanc",name:"Blanc",hex:"#F0F0F0"},{id:"jaune",name:"Jaune",hex:"#FFD700"}],
    profile:{durabilite:72,controle:82,vitesse:76,puissance:88,feeling:80}, tension:{min:9,max:17,rec:14},
    description:"Version Power du BG80. Même excellente maniabilité que le BG80, mais avec une répulsion améliorée pour plus de puissance au smash.",
    bestFor:["Smasheurs","Puissance","Confirmés"] },
  { id:"bg66um", brand:"Yonex", name:"BG66 Ultimax", price:21, gauge:"0.65mm", type:"Monofilament",
    colors:[{id:"blanc",name:"Blanc",hex:"#F0F0F0"},{id:"bleu",name:"Bleu",hex:"#00BFFF"},{id:"jaune",name:"Jaune",hex:"#FFD700"},{id:"orange",name:"Orange",hex:"#FF8C00"}],
    profile:{durabilite:55,controle:80,vitesse:95,puissance:80,feeling:90}, tension:{min:9,max:17,rec:14},
    description:"Vitesse maximale et son cristallin. Pour les joueurs qui attaquent vite et cherchent un feeling premium.",
    bestFor:["Offensifs","Compétiteurs","Simple"] },
  { id:"aerosonic", brand:"Yonex", name:"Aerosonic", price:21, gauge:"0.61mm", type:"Monofilament",
    colors:[{id:"blanc",name:"Blanc",hex:"#F0F0F0"},{id:"argent",name:"Argent",hex:"#C0C0C0"}],
    profile:{durabilite:40,controle:85,vitesse:90,puissance:70,feeling:95}, tension:{min:9,max:17,rec:14},
    description:"Le plus fin des cordages Yonex. Feeling exceptionnel et réactivité maximale. Réservé aux joueurs expérimentés.",
    bestFor:["Experts","Feeling max","Contrôle fin"] },
  { id:"aerobite", brand:"Yonex", name:"Aerobite", price:21, gauge:"0.61/0.67mm", type:"Hybride",
    colors:[{id:"blanc-gris",name:"Blanc / Gris",hex:"#DCDCDC",hex2:"#888888"},{id:"blanc-jaune",name:"Blanc / Jaune",hex:"#F0F0F0",hex2:"#FFD700"}],
    profile:{durabilite:45,controle:88,vitesse:92,puissance:78,feeling:94}, tension:{min:9,max:17,rec:14},
    description:"Cordage hybride révolutionnaire (2 cordes différentes). La corde principale 0.61mm apporte la vitesse, la transversale 0.67mm génère une rotation naturelle du volant pour des effets dévastateurs.",
    bestFor:["Experts","Rotation","Effet volant"] },
  { id:"aerobite-boost", brand:"Yonex", name:"Aerobite Boost", price:21, gauge:"0.61/0.72mm", type:"Hybride",
    colors:[{id:"blanc-gris",name:"Blanc / Gris",hex:"#DCDCDC",hex2:"#888888"},{id:"jaune-noir",name:"Jaune / Noir",hex:"#FFD700",hex2:"#222222"}],
    profile:{durabilite:58,controle:86,vitesse:88,puissance:80,feeling:90}, tension:{min:9,max:17,rec:13},
    description:"Version plus durable de l'Aerobite. La transversale 0.72mm offre plus de résistance tout en conservant les effets de rotation caractéristiques.",
    bestFor:["Effet volant","Durabilité","Confirmés"] },
  { id:"exbolt63", brand:"Yonex", name:"Exbolt 63", price:21, gauge:"0.63mm", type:"Monofilament",
    colors:[{id:"blanc",name:"Blanc",hex:"#F0F0F0"},{id:"jaune",name:"Jaune",hex:"#FFD700"},{id:"orange",name:"Orange",hex:"#FF6A00"}],
    profile:{durabilite:50,controle:82,vitesse:98,puissance:82,feeling:92}, tension:{min:9,max:17,rec:15},
    description:"Nouvelle génération Exbolt ultra-rapide. Répulsion maximale et son percutant. Le 0.63mm offre une vitesse de plume exceptionnelle pour dominer les échanges rapides.",
    bestFor:["Vitesse max","Compétition","Attaquants"] },
  { id:"exbolt65", brand:"Yonex", name:"Exbolt 65", price:21, gauge:"0.65mm", type:"Monofilament",
    colors:[{id:"blanc",name:"Blanc",hex:"#F0F0F0"},{id:"jaune",name:"Jaune",hex:"#FFD700"},{id:"bleu",name:"Bleu",hex:"#1E90FF"},{id:"orange",name:"Orange",hex:"#FF6A00"}],
    profile:{durabilite:62,controle:85,vitesse:92,puissance:84,feeling:88}, tension:{min:9,max:17,rec:14},
    description:"Le meilleur équilibre de la gamme Exbolt. Associe vitesse élevée et bon contrôle. Le cordage de référence pour les joueurs compétitifs polyvalents.",
    bestFor:["Polyvalents","Compétition","Confirmés"] },
  { id:"exbolt68", brand:"Yonex", name:"Exbolt 68", price:21, gauge:"0.68mm", type:"Monofilament",
    colors:[{id:"blanc",name:"Blanc",hex:"#F0F0F0"},{id:"jaune",name:"Jaune",hex:"#FFD700"},{id:"bleu",name:"Bleu",hex:"#1E90FF"}],
    profile:{durabilite:75,controle:90,vitesse:82,puissance:82,feeling:85}, tension:{min:9,max:17,rec:13},
    description:"L'Exbolt orienté contrôle et durabilité. Plus épais que ses frères, il offre une frappe précise et une longévité accrue, idéal pour les joueurs réguliers exigeants.",
    bestFor:["Contrôle","Durabilité","Club"] },
  // ── VICTOR ──
  { id:"vbs66n", brand:"Victor", name:"VBS-66N", price:21, gauge:"0.66mm", type:"Multifilament",
    colors:[{id:"blanc",name:"Blanc",hex:"#F0F0F0"},{id:"orange",name:"Orange",hex:"#FF6B35"},{id:"bleu",name:"Bleu",hex:"#1E90FF"}],
    profile:{durabilite:65,controle:85,vitesse:80,puissance:75,feeling:80}, tension:{min:9,max:17,rec:13},
    description:"Contrôle supérieur et bonne durabilité. Très apprécié des joueurs de club engagés.",
    bestFor:["Joueurs de club","Polyvalents","Compétition"] },
  { id:"vbs70", brand:"Victor", name:"VBS-70", price:21, gauge:"0.70mm", type:"Multifilament",
    colors:[{id:"blanc",name:"Blanc",hex:"#F0F0F0"},{id:"vert",name:"Vert",hex:"#32CD32"},{id:"jaune",name:"Jaune",hex:"#FFD700"}],
    profile:{durabilite:85,controle:75,vitesse:70,puissance:85,feeling:70}, tension:{min:9,max:17,rec:13},
    description:"Puissance et durabilité élevées. Cordage robuste parfait pour les joueurs qui smashent fort.",
    bestFor:["Smasheurs","Puissance","Endurance"] },
  // ── LI-NING ──
  { id:"no1", brand:"Li-Ning", name:"No.1", price:21, gauge:"0.65mm", type:"Monofilament",
    colors:[{id:"blanc",name:"Blanc",hex:"#F0F0F0"},{id:"rose",name:"Rose",hex:"#FF1493"}],
    profile:{durabilite:50,controle:80,vitesse:95,puissance:85,feeling:88}, tension:{min:9,max:17,rec:14},
    description:"Cordage haut de gamme Li-Ning. Alliance vitesse et puissance pour les joueurs qui aiment attaquer.",
    bestFor:["Compétiteurs","Attaquants","Experts"] },
  { id:"ap65", brand:"Li-Ning", name:"AP65", price:21, gauge:"0.65mm", type:"Multifilament",
    colors:[{id:"blanc",name:"Blanc",hex:"#F0F0F0"},{id:"violet",name:"Violet",hex:"#9B59B6"},{id:"bleu",name:"Bleu",hex:"#1E90FF"}],
    profile:{durabilite:75,controle:72,vitesse:75,puissance:70,feeling:72}, tension:{min:9,max:17,rec:13},
    description:"Excellent rapport qualité/prix Li-Ning. Idéal pour une pratique régulière sans se ruiner.",
    bestFor:["Pratique régulière","Bon Q/P","Loisir avancé"] },
  // ── ASHAWAY ──
  { id:"zymax62", brand:"Ashaway", name:"Zymax 62 Fire", price:21, gauge:"0.62mm", type:"Monofilament",
    colors:[{id:"rouge",name:"Rouge feu",hex:"#FF4500"},{id:"blanc",name:"Blanc",hex:"#F0F0F0"}],
    profile:{durabilite:45,controle:82,vitesse:98,puissance:80,feeling:92}, tension:{min:9,max:17,rec:15},
    description:"Le cordage le plus rapide d'Ashaway. Diamètre ultra-fin pour une vitesse maximale et un son explosif.",
    bestFor:["Vitesse max","Compétiteurs","Attaquants"] },
  { id:"zymax66", brand:"Ashaway", name:"Zymax 66 Fire", price:21, gauge:"0.66mm", type:"Monofilament",
    colors:[{id:"orange",name:"Orange feu",hex:"#FF6600"},{id:"blanc",name:"Blanc",hex:"#F0F0F0"},{id:"bleu",name:"Bleu",hex:"#1E90FF"}],
    profile:{durabilite:60,controle:85,vitesse:88,puissance:82,feeling:86}, tension:{min:9,max:17,rec:14},
    description:"Excellent équilibre vitesse/contrôle. Très populaire en compétition pour son feeling dynamique.",
    bestFor:["Compétition","Polyvalents","Confirmés"] },
  { id:"zymax68tx", brand:"Ashaway", name:"Zymax 68 TX", price:21, gauge:"0.68mm", type:"Monofilament",
    colors:[{id:"bleu",name:"Bleu",hex:"#1E90FF"},{id:"blanc",name:"Blanc",hex:"#F0F0F0"},{id:"jaune",name:"Jaune",hex:"#FFD700"}],
    profile:{durabilite:70,controle:88,vitesse:80,puissance:85,feeling:84}, tension:{min:9,max:17,rec:13},
    description:"Contrôle supérieur et durabilité accrue. Idéal pour les joueurs qui recherchent précision et longévité.",
    bestFor:["Contrôle","Double","Joueurs de club"] },
  { id:"micropower", brand:"Ashaway", name:"Micropower", price:21, gauge:"0.70mm", type:"Multifilament",
    colors:[{id:"turquoise",name:"Turquoise",hex:"#00CED1"},{id:"blanc",name:"Blanc",hex:"#F0F0F0"}],
    profile:{durabilite:85,controle:75,vitesse:70,puissance:78,feeling:74}, tension:{min:9,max:17,rec:13},
    description:"Multifilament robuste et abordable. Excellent rapport qualité/durabilité pour une pratique intensive.",
    bestFor:["Pratique régulière","Débutants avancés","Durabilité"] },
];

const HOURS = [
  { day:"Lundi", h:"Fermé" },
  { day:"Mardi", h:"13h00 – 18h30" },
  { day:"Mercredi", h:"11h00 – 18h30" },
  { day:"Jeudi", h:"11h00 – 18h30" },
  { day:"Vendredi", h:"11h00 – 18h30" },
  { day:"Samedi", h:"10h00 – 17h30" },
  { day:"Dimanche", h:"Fermé" },
];

const ADMIN_CODE = "admin2024";
const TODAY_NAME = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"][new Date().getDay()];

const DELIVERY_MODES = [
  { id:"standard",  label:"Standard",        delay:"24h – 48h",      delta:0,  color:"#aaa",    icon:"🕐", desc:"Récupérez votre raquette le lendemain ou en 48h" },
  { id:"sameday",   label:"Dans la journée", delay:"Aujourd'hui",    delta:2,  color:"#60a5fa", icon:"📅", desc:"Cordage effectué et prêt dans la journée" },
  { id:"express",   label:"Express — 1h",   delay:"Sous 1 heure",   delta:5,  color:"#f59e0b", icon:"⚡", desc:"Raquette cordée et prête en moins d'une heure" },
  { id:"partner",   label:"Prix partenaire", delay:"24h – 48h",      delta:-3, color:"#00d4aa", icon:"🤝", desc:"Tarif réservé aux membres de clubs partenaires DC.SPORTS" },
];

// ─── STORAGE ──────────────────────────────────────────────────────────────────

const store = {
  async get(k) { try { const v = localStorage.getItem('dcsports_'+k); return v ? JSON.parse(v) : null; } catch { return null; } },
  async set(k, v) { try { localStorage.setItem('dcsports_'+k, JSON.stringify(v)); } catch {} },
};

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────

const Badge = ({ status }) => {
  const cfg = {
    pending:   { label:"En attente", bg:"rgba(245,158,11,0.18)", c:"#f59e0b", Icon: Clock },
    stringing: { label:"En cours",   bg:"rgba(99,179,237,0.18)", c:"#60a5fa", Icon: Package },
    ready:     { label:"Prête ✓",    bg:"rgba(0,212,170,0.18)", c:"#00d4aa", Icon: CheckCircle },
  }[status] || { label: status, bg:"rgba(255,255,255,0.1)", c:"#aaa", Icon: AlertCircle };
  const { label, bg, c, Icon } = cfg;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:100, background:bg, color:c, fontWeight:700, fontSize:11, letterSpacing:.5 }}>
      <Icon size={11} />{label}
    </span>
  );
};

const Bar = ({ label, val, color }) => (
  <div style={{ marginBottom:10 }}>
    <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
      <span style={{ color:"rgba(255,255,255,0.5)" }}>{label}</span>
      <span style={{ color:"white", fontWeight:700 }}>{val}</span>
    </div>
    <div style={{ height:5, background:"rgba(255,255,255,0.08)", borderRadius:10, overflow:"hidden" }}>
      <div style={{ height:"100%", width:`${val}%`, background:color, borderRadius:10, transition:"width .6s" }} />
    </div>
  </div>
);

const Input = ({ style, ...p }) => (
  <input style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, color:"white", padding:"12px 16px", width:"100%", fontFamily:"inherit", fontSize:15, outline:"none", ...style }} {...p} />
);

const Btn = ({ variant="primary", style, children, ...p }) => {
  const base = { padding:"14px 24px", borderRadius:12, fontWeight:700, fontSize:15, cursor:"pointer", border:"none", fontFamily:"inherit", transition:"all .2s", ...style };
  const styles = variant === "primary"
    ? { ...base, background:"linear-gradient(135deg,#00d4aa,#0099ff)", color:"white" }
    : { ...base, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.14)", color:"white" };
  return <button style={styles} {...p}>{children}</button>;
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage]             = useState("home");
  const [user, setUser]             = useState(null);
  const [isAdmin, setIsAdmin]       = useState(false);
  const [users, setUsers]           = useState([]);
  const [orders, setOrders]         = useState([]);
  const [toast, setToast]           = useState(null);
  const [modal, setModal]           = useState(null); // string object for detail modal
  const [adminFcmToken, setAdminFcmToken] = useState(null);
  const [forgotEmail, setForgotEmail] = useState(""); const [forgotMsg, setForgotMsg] = useState(null);

  // forms
  const [loginF,  setLoginF]  = useState({ email:"", password:"" });
  const [regF,    setRegF]    = useState({ name:"", email:"", password:"" });
  const [authErr, setAuthErr] = useState("");
  const [adminPwd,setAdminPwd]= useState("");
  const [adminTab,  setAdminTab]  = useState("commandes");
  const [draft,   setDraft]   = useState({ racket:"", stringId:null, colorId:null, tension:24, notes:"", deliveryMode:"standard" });
  const [brandFilter, setBrandFilter] = useState("Tous");

  useEffect(() => {
    (async () => {
      try {
        const u = await getUsers();
        const o = await getOrders();
        setUsers(u); setOrders(o);
        const adminSaved = localStorage.getItem('dcsports_isAdmin') === 'true';
        const sessionStr = localStorage.getItem('dcsports_session');
        const s = sessionStr ? JSON.parse(sessionStr) : null;
        if (adminSaved) { setIsAdmin(true); setPage("admin"); }
        else if (s) { const found = u.find(x => x.email === s.email || x.id === s.id); if (found) { setUser(found); setPage("account"); } }
        initFCM().then(token => { if (token) listenForegroundMessages(p => notify(p.notification?.title || 'Notification')); playSound('new_order'); });
      } catch (e) { console.error("Init error:", e); }
    })();
  }, []);

  const notify = (msg, type="ok") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  // ── SOUND NOTIFICATIONS ───────────────────────────────────────────────────
  const playSound = (type) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      if (type === 'new_order') {
        o.frequency.setValueAtTime(880, ctx.currentTime);
        o.frequency.setValueAtTime(1100, ctx.currentTime + 0.12);
        g.gain.setValueAtTime(0.35, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.4);
      } else if (type === 'status_update') {
        o.frequency.setValueAtTime(660, ctx.currentTime);
        o.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
        g.gain.setValueAtTime(0.3, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.35);
      } else {
        o.frequency.setValueAtTime(740, ctx.currentTime);
        g.gain.setValueAtTime(0.25, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.3);
      }
    } catch(e) { /* AudioContext not available */ }
  };

  // ── FCM Foreground Listener ─────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    let unsubscribe = null;
    try {
      unsubscribe = listenForegroundMessages((payload) => {
      const { title, body } = payload.notification || {};
      notify(`${title} — ${body}`);
      playSound('notification');
    });
    } catch(e) { console.warn("FCM listener failed:", e); }
    return unsubscribe;
  }, [user]);

  // ── AUTH ──────────────────────────────────────────────────────────────────

  const doLogin = async () => {
    setAuthErr("");
    // Lire valeurs depuis DOM (autofill navigateur)
    const loginEmailInputs = document.querySelectorAll('input[placeholder="Email"]');
    const loginPassInputs = document.querySelectorAll('input[placeholder="Mot de passe"]');
    const lEmail = loginF.email || (loginEmailInputs[0] ? loginEmailInputs[0].value.trim() : '');
    const lPassword = loginF.password || (loginPassInputs[0] ? loginPassInputs[0].value : '');
    // Connexion admin
    if (lEmail === import.meta.env.VITE_ADMIN_EMAIL && lPassword === import.meta.env.VITE_ADMIN_PASSWORD) {
      setIsAdmin(true); setPage("admin"); localStorage.setItem('dcsports_isAdmin', 'true');
      try {
        const token = await initFCM();
        if (token) { setAdminFcmToken(token); localStorage.setItem('dcsports_adminFcmToken', token); await saveAdminFcmToken(token); }
      } catch(e) { console.warn("FCM admin init failed:", e); }
      return;
    }
    // Connexion client - chercher dans Firestore
    const u = await getUserByEmail(lEmail);
    if (!u || u.password !== lPassword) { setAuthErr("Email ou mot de passe incorrect"); return; }
    setUser(u);
    // Sauvegarder FCM token du client dans Firestore
    try {
      const token = await initFCM();
      if (token) {
        const updatedUser = { ...u, fcmToken: token };
        setUser(updatedUser);
        await saveUser(updatedUser);
        localStorage.setItem('dcsports_session', JSON.stringify(updatedUser));
      } else {
        localStorage.setItem('dcsports_session', JSON.stringify(u));
      }
    } catch(e) {
      localStorage.setItem('dcsports_session', JSON.stringify(u));
    }
    // Recharger la liste users
    const allUsers = await getUsers();
    setUsers(allUsers);
    setPage("account"); notify('Bienvenue ' + u.name + ' !');
  };





  const doRegister = async () => {
    // IMPORTANT: Lire le DOM AVANT tout setState (sinon React re-render efface les valeurs)
    const _regInputs = document.querySelectorAll('input[placeholder="Nom complet"], input[placeholder="Email"], input[placeholder="Mot de passe"]');
    const _domName = _regInputs[0] ? _regInputs[0].value.trim() : '';
    const _domEmail = _regInputs[1] ? _regInputs[1].value.trim() : '';
    const _domPass = _regInputs[2] ? _regInputs[2].value : '';
    const rName = regF.name || _domName;
    const rEmail = regF.email || _domEmail;
    const rPassword = regF.password || _domPass;
    setAuthErr("");
    if (!rName || !rEmail || !rPassword) { setAuthErr("Tous les champs sont requis"); return; }
    // Vérifier si l'email existe déjà dans Firestore
    try {
      const existing = await getUserByEmail(rEmail);
      if (existing) { setAuthErr("Email déjà utilisé"); return; }
    } catch(e) { console.warn("getUserByEmail error:", e); }
    // Créer l'objet utilisateur
    const nu = { id: Date.now().toString(), name: rName, email: rEmail, password: rPassword, createdAt: new Date().toISOString() };
    // Récupérer le token FCM pour les notifications client
    let userWithToken = nu;
    try {
      const token = await initFCM();
      if (token) { userWithToken = { ...nu, fcmToken: token }; }
    } catch(e) { console.warn("FCM init failed:", e); }
    // Sauvegarder dans Firestore
    try {
      await saveUser(userWithToken);
    } catch(e) {
      console.error("saveUser error:", e);
      setAuthErr("Erreur lors de la création du compte. Réessayez.");
      return;
    }
    // Mettre à jour l'état local
    const allUsers = await getUsers().catch(() => []);
    setUsers(allUsers);
    setUser(userWithToken);
    localStorage.setItem('dcsports_session', JSON.stringify(userWithToken));
    setPage("account"); notify('Compte créé ! Bienvenue ' + rName + ' !');
  };
  const doLogout = async () => { setUser(null); setIsAdmin(false); localStorage.removeItem("dcsports_session"); localStorage.setItem("dcsports_isAdmin", "false"); setPage("home"); };
  const doForgotPassword = async () => { setForgotMsg(null); const em=forgotEmail.trim().toLowerCase(); if (!em){setForgotMsg({ok:false,text:"Saisissez votre email."});return;} const u=users.find(x=>x.email.toLowerCase()===em); if(!u){setForgotMsg({ok:false,text:"Aucun compte trouvé."});return;} const np=Math.random().toString(36).slice(2,5).toUpperCase()+Math.floor(10+Math.random()*90); const upd={...u,password:np}; const upds=users.map(x=>x.id===u.id?upd:x); setUsers(upds); await saveUser(upds.find(u => u.email === forgotEmail)); const allU = await getUsers(); setUsers(allU); try{await sendResetPasswordEmail({toEmail:u.email,toName:u.name,newPassword:np}); setForgotMsg({ok:true,text:"Nouveau mot de passe envoyé à "+u.email}); setForgotEmail("");}catch(e){setForgotMsg({ok:false,text:"Erreur envoi. Contactez le magasin."});} };

  // ── ORDER ─────────────────────────────────────────────────────────────────

  const submitOrder = async () => {
    if (!draft.racket || !draft.stringId) { notify("Veuillez remplir tous les champs", "err"); return; }
    const str = STRINGS.find(s => s.id === draft.stringId);
    const newOrder = { id: Date.now().toString(), userId: user.id, userEmail: user.email, userName: user.name,
      racket: draft.racket, string: str, tension: draft.tension, colorId: draft.colorId, notes: draft.notes, deliveryMode: draft.deliveryMode,
      status: "pending", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    // Sauvegarder la commande dans Firestore
    try { await saveOrder(newOrder); } catch(e) { notify("Erreur lors de la commande", "err"); return; }
    // Mettre à jour l'état local
    const allOrders = await getOrders();
    setOrders(allOrders);
    // Notifier l'admin via push notification
    try {
      const adminToken = await getAdminFcmToken();
      if (adminToken) { await notifyAdmin({ adminFcmToken: adminToken, order: newOrder }); }
    } catch(e) { console.warn("Admin notify failed:", e); }
    setDraft({ racket:"", stringId:null, colorId:null, tension:24, notes:"", deliveryMode:"standard" });
    setPage("account"); notify("Commande envoyée ! Nous vous contacterons bientôt.");
  };

  const doDeleteOrder = async (orderId) => {
    if (!window.confirm('Supprimer cette commande définitivement ?')) return;
    try { await deleteOrder(orderId); } catch(e) { console.warn('delete error', e); }
    setOrders(prev => prev.filter(o => o.id !== orderId));
    notify("Commande supprimée", "ok");
  };

    const updateStatus = async (id, status) => {
    // Mettre à jour dans Firestore
    try { await updateOrder(id, { status }); } catch(e) { notify("Erreur mise à jour commande", "err"); return; }
    // Mettre à jour l'état local
    const no = orders.map(o => o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o);
    setOrders(no);
    playSound('status_update');
    // Notifier le client si commande prête
    if (status === "ready" || status === "in_progress") {
      const order = no.find(o => o.id === id);
      if (order) {
        const clientUser = users.find(u => u.email === order.userEmail || u.id === order.userId);
        if (clientUser && clientUser.fcmToken) {
          try { await notifyClient({clientFcmToken: clientUser.fcmToken, order, title: status === "ready" ? '✅ Cordage pr�t !' : '🎾 Cordage en cours !', body: status === "ready" ? `Votre raquette est pr�te � �tre r�cup�r�e !` : `Nous avons commenc� le cordage de votre raquette !`}); } catch(e) { console.warn("Client notify failed:", e); }
        }
      }
    }
  };

  // ── COMPUTED ──────────────────────────────────────────────────────────────

  const myOrders    = orders.filter(o => user && (o.userEmail === user.email || o.userId === user.id));
  const hasReady    = myOrders.some(o => o.status === "ready");
  const pendingCnt  = orders.filter(o => o.status === "pending").length;
  const brands      = ["Tous", ...new Set(STRINGS.map(s => s.brand))];
  const visibleStr  = brandFilter === "Tous" ? STRINGS : STRINGS.filter(s => s.brand === brandFilter);
  const selStr      = STRINGS.find(s => s.id === draft.stringId);

  // ── CSS ───────────────────────────────────────────────────────────────────

  const G = {
    page:  { fontFamily:"'Barlow',sans-serif", background:"#07070d", minHeight:"100vh", color:"white" },
    wrap:  { maxWidth:900, margin:"0 auto", padding:"28px 18px" },
    card:  { background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16 },
    chip:  { display:"inline-flex", alignItems:"center", gap:6, padding:"6px 14px", background:"rgba(0,212,170,0.12)", border:"1px solid rgba(0,212,170,0.3)", borderRadius:100, fontSize:13, fontWeight:700, color:"#00d4aa" },
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={G.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800;900&family=Barlow+Condensed:wght@700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#333;border-radius:4px}
        input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.3)}
        input:focus,textarea:focus{border-color:#00d4aa !important;outline:none}
        textarea{resize:vertical;min-height:80px;font-family:inherit;font-size:15px}
        select option{background:#111}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .fade{animation:fadeUp .3s ease}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}.pulse{animation:pulse 1.4s infinite}
        .hov{transition:all .2s;cursor:pointer}
        .hov:hover{background:rgba(255,255,255,0.07) !important;border-color:rgba(0,212,170,.35) !important;transform:translateY(-2px)}
        .sel{border-color:#00d4aa !important;background:rgba(0,212,170,0.07) !important}
        .grad{background:linear-gradient(135deg,#00d4aa,#0099ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
      `}</style>

      {/* ── TOAST ── */}
      {toast && (
        <div style={{ position:"fixed", top:18, right:18, zIndex:9999, padding:"14px 20px", borderRadius:12, fontWeight:700, fontSize:14,
          background: toast.type === "err" ? "rgba(239,68,68,.95)" : "rgba(0,212,170,.95)",
          color:"white", boxShadow:"0 8px 32px rgba(0,0,0,.4)", maxWidth:320, backdropFilter:"blur(12px)" }}>
          {toast.msg}
        </div>
      )}

      {/* ── NAV ── */}
      <nav style={{ borderBottom:"1px solid rgba(255,255,255,0.06)", position:"sticky", top:0, zIndex:100, background:"rgba(7,7,13,.95)", backdropFilter:"blur(14px)" }}>
        <div style={{ maxWidth:900, margin:"0 auto", padding:"0 18px", display:"flex", alignItems:"center", justifyContent:"space-between", height:60 }}>

          {/* Logo */}
          <div className="hov" onClick={() => { setPage("home"); _adminClicks++; if(_adminClicks >= 5){ _adminClicks = 0; setPage("admin"); } }} style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#00d4aa,#0099ff)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:13 }}>DC</div>
            <span style={{ fontFamily:"'Barlow Condensed'", fontWeight:900, fontSize:20, letterSpacing:1 }}>DC.SPORTS</span>
          </div>

          {/* Links */}
          <div style={{ display:"flex", gap:4, alignItems:"center", flexWrap:"wrap" }}>
            {[["catalog","Cordages"],["order","Commander"],["info","Infos"]].map(([p,l]) => (
              <div key={p} className="hov" onClick={() => setPage(p)} style={{ padding:"7px 13px", borderRadius:8, fontSize:14, fontWeight:600, background: page===p ? "rgba(255,255,255,0.1)" : "transparent" }}>{l}</div>
            ))}

            {user ? (
              <div className="hov" onClick={() => setPage("account")} style={{ padding:"7px 13px", borderRadius:8, fontSize:14, fontWeight:700, display:"flex", alignItems:"center", gap:6, background: page==="account" ? "rgba(255,255,255,0.1)" : "transparent" }}>
                <User size={14} />{user.name.split(" ")[0]}
                {hasReady && <span className="pulse" style={{ width:8, height:8, background:"#00d4aa", borderRadius:"50%" }} />}
              </div>
            ) : (
              <Btn style={{ padding:"8px 18px", fontSize:13 }} onClick={() => setPage("login")}>Connexion</Btn>
            )}

          </div>
        </div>
      </nav>

      <div style={G.wrap}>

        {/* ════════════════════════════════ HOME ═══════════════════════════════ */}
        {page === "home" && (
          <div className="fade">
            {/* Hero */}
            <div style={{ textAlign:"center", padding:"60px 0 50px" }}>
              <div style={G.chip}>🏸 Spécialiste Badminton — Essonne (91)</div>
              <h1 style={{ fontFamily:"'Barlow Condensed'", fontSize:"clamp(52px,11vw,88px)", fontWeight:900, lineHeight:.9, margin:"24px 0 18px", letterSpacing:-2 }}>
                CORDAGE<br /><span className="grad">EXPERT</span>
              </h1>
              <p style={{ color:"rgba(255,255,255,0.55)", fontSize:18, maxWidth:460, margin:"0 auto 36px", lineHeight:1.65 }}>
                Choisissez votre cordage en ligne, déposez votre raquette, on s'occupe du reste. Raquette prête en 24h–48h.
              </p>
              <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
                <Btn onClick={() => setPage("order")} style={{ fontSize:16, padding:"16px 32px" }}>Commander un cordage →</Btn>
                <Btn variant="sec" onClick={() => setPage("catalog")} style={{ fontSize:16, padding:"16px 32px" }}>Voir les cordages</Btn>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:40 }}>
              {[["19+","Cordages disponibles","🎯"],["24–48h","Délai de cordage","⚡"],["4","Marques premium","🏆"]].map(([v,l,ic],i) => (
                <div key={i} style={{ ...G.card, padding:"22px 16px", textAlign:"center" }}>
                  <div style={{ fontSize:26, marginBottom:8 }}>{ic}</div>
                  <div style={{ fontFamily:"'Barlow Condensed'", fontSize:34, fontWeight:900, color:"#00d4aa" }}>{v}</div>
                  <div style={{ color:"rgba(255,255,255,0.45)", fontSize:12, marginTop:4 }}>{l}</div>
                </div>
              ))}
            </div>

            {/* Steps */}
            <div style={{ ...G.card, padding:32 }}>
              <h2 style={{ fontFamily:"'Barlow Condensed'", fontSize:30, fontWeight:900, marginBottom:28 }}>Comment ça marche ?</h2>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))", gap:24 }}>
                {[
                  ["01","Choisissez","Sélectionnez cordage et tension en ligne","🎯"],
                  ["02","Déposez","Apportez votre raquette au magasin","🏸"],
                  ["03","On corde","Votre raquette est cordée par un expert","⚡"],
                  ["04","Notifié","Vous recevez une notification quand c'est prêt","🔔"],
                ].map(([s,t,d,ic]) => (
                  <div key={s}>
                    <div style={{ fontSize:28, marginBottom:8 }}>{ic}</div>
                    <div style={{ fontSize:11, fontWeight:900, color:"#00d4aa", letterSpacing:2, marginBottom:6 }}>ÉTAPE {s}</div>
                    <div style={{ fontWeight:700, marginBottom:6 }}>{t}</div>
                    <div style={{ color:"rgba(255,255,255,0.48)", fontSize:13, lineHeight:1.55 }}>{d}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing banner */}
            <div style={{ marginTop:20 }}>
              <h2 style={{ fontFamily:"'Barlow Condensed'", fontSize:30, fontWeight:900, marginBottom:16 }}>NOS TARIFS</h2>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:12 }}>
                {DELIVERY_MODES.map(m => {
                  const price = 21 + m.delta;
                  return (
                    <div key={m.id} className="hov" style={{ ...G.card, padding:"20px 18px", borderColor: m.id==="express" ? "rgba(245,158,11,0.3)" : m.id==="partner" ? "rgba(0,212,170,0.3)" : "rgba(255,255,255,0.08)", cursor:"pointer" }}
                      onClick={() => { setDraft(d => ({...d, deliveryMode:m.id})); setPage("order"); }}>
                      <div style={{ fontSize:26, marginBottom:8 }}>{m.icon}</div>
                      <div style={{ fontWeight:800, fontSize:15, marginBottom:4 }}>{m.label}</div>
                      <div style={{ fontSize:12, color:"rgba(255,255,255,0.42)", marginBottom:12, lineHeight:1.5 }}>{m.desc}</div>
                      <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
                        {m.delta !== 0 && <span style={{ fontSize:13, color:"rgba(255,255,255,0.3)", textDecoration:"line-through" }}>21€</span>}
                        <span style={{ fontFamily:"'Barlow Condensed'", fontSize:34, fontWeight:900, color: m.delta < 0 ? "#00d4aa" : m.delta > 0 ? "#f59e0b" : "white" }}>{price}€</span>
                      </div>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:2 }}>{m.delay}</div>
                      {m.delta !== 0 && (
                        <div style={{ marginTop:10, display:"inline-flex", alignItems:"center", padding:"3px 10px", borderRadius:100, fontSize:11, fontWeight:800,
                          background: m.delta > 0 ? "rgba(245,158,11,0.12)" : "rgba(0,212,170,0.12)",
                          color: m.delta > 0 ? "#f59e0b" : "#00d4aa" }}>
                          {m.delta > 0 ? `+${m.delta}€` : `${m.delta}€ de réduction`}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop:10, fontSize:12, color:"rgba(255,255,255,0.28)", textAlign:"center" }}>Tarifs cordage seul · Main d'œuvre en sus · Paiement en magasin au retrait</div>
            </div>

            <div style={{ textAlign:"center", marginTop:40 }}>
              <span style={{ color:"rgba(255,255,255,0.18)", fontSize:12, cursor:"pointer" }} onClick={() => setPage("login")}>Accès équipe →</span>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════ CATALOG ══════════════════════════════ */}
        {page === "catalog" && (
          <div className="fade">
            <h1 style={{ fontFamily:"'Barlow Condensed'", fontSize:46, fontWeight:900, marginBottom:6 }}>NOS CORDAGES</h1>
            <p style={{ color:"rgba(255,255,255,0.5)", marginBottom:28 }}>Choisissez le cordage adapté à votre niveau et style de jeu</p>

            {/* Brand filter */}
            <div style={{ display:"flex", gap:8, marginBottom:28, flexWrap:"wrap" }}>
              {brands.map(b => (
                <button key={b} onClick={() => setBrandFilter(b)} style={{ padding:"8px 18px", borderRadius:100, border:"1px solid", fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:"inherit", transition:"all .2s",
                  background: brandFilter===b ? "linear-gradient(135deg,#00d4aa,#0099ff)" : "rgba(255,255,255,0.06)",
                  borderColor: brandFilter===b ? "transparent" : "rgba(255,255,255,0.12)", color:"white" }}>{b}</button>
              ))}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))", gap:16 }}>
              {visibleStr.map(str => (
                <div key={str.id} className="hov" style={{ ...G.card, padding:22 }} onClick={() => setModal(str)}>
                  {/* Header */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                    <div>
                      <div style={{ fontSize:10, fontWeight:900, color:"rgba(255,255,255,0.38)", letterSpacing:2, marginBottom:3 }}>{str.brand.toUpperCase()}</div>
                      <div style={{ fontFamily:"'Barlow Condensed'", fontSize:30, fontWeight:900 }}>{str.name}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontFamily:"'Barlow Condensed'", fontSize:28, fontWeight:900, color:"#00d4aa" }}>{str.price}€</div>
                      <div style={{ fontSize:10, color:"rgba(255,255,255,0.38)" }}>{str.gauge}</div>
                    </div>
                  </div>

                  {/* Color dots + type */}
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:12, flexWrap:"wrap" }}>
                    {str.colors.map(c => (
                      <div key={c.id} title={c.name} style={{ width:14, height:14, borderRadius:"50%", background: c.hex2 ? `linear-gradient(135deg,${c.hex} 50%,${c.hex2} 50%)` : c.hex, border:"2px solid rgba(255,255,255,0.2)", flexShrink:0 }} />
                    ))}
                    <span style={{ fontSize:12, color:"rgba(255,255,255,0.42)", marginLeft:2 }}>{str.colors.length} couleur{str.colors.length>1?"s":""} · {str.type}</span>
                  </div>

                  <p style={{ color:"rgba(255,255,255,0.58)", fontSize:12, lineHeight:1.55, marginBottom:16 }}>{str.description}</p>

                  {/* Mini bars */}
                  <div style={{ display:"flex", gap:6 }}>
                    {[["Dur.",str.profile.durabilite,"#00d4aa"],["Ctrl",str.profile.controle,"#60a5fa"],["Vit.",str.profile.vitesse,"#f59e0b"]].map(([k,v,c]) => (
                      <div key={k} style={{ flex:1, background:"rgba(255,255,255,0.04)", borderRadius:8, padding:"8px 4px", textAlign:"center" }}>
                        <div style={{ height:36, display:"flex", alignItems:"flex-end", justifyContent:"center", marginBottom:4 }}>
                          <div style={{ width:18, borderRadius:3, background:c, height:`${v*.36}px` }} />
                        </div>
                        <div style={{ fontSize:10, color:"rgba(255,255,255,0.38)" }}>{k}</div>
                        <div style={{ fontSize:11, fontWeight:700 }}>{v}</div>
                      </div>
                    ))}
                  </div>

                  <Btn style={{ width:"100%", marginTop:16, padding:"10px", fontSize:13 }}
                    onClick={e => { e.stopPropagation(); setDraft(d => ({...d, stringId:str.id, tension:str.tension.rec})); setPage("order"); }}>
                    Commander ce cordage
                  </Btn>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════ ORDER ════════════════════════════════ */}
        {page === "order" && (
          <div className="fade" style={{ maxWidth:600, margin:"0 auto" }}>
            <h1 style={{ fontFamily:"'Barlow Condensed'", fontSize:46, fontWeight:900, marginBottom:6 }}>COMMANDER</h1>
            <p style={{ color:"rgba(255,255,255,0.5)", marginBottom:30 }}>Remplissez le formulaire, déposez votre raquette au magasin</p>

            {/* Step 1 */}
            <div style={{ ...G.card, padding:26, marginBottom:16 }}>
              <StepHead n={1} label="Votre raquette" />
              <Input placeholder="Ex: Yonex Astrox 99 Pro, Victor Thruster K 9900…"
                value={draft.racket} onChange={e => setDraft(d => ({...d, racket:e.target.value}))} />
            </div>

            {/* Step 2 */}
            <div style={{ ...G.card, padding:26, marginBottom:16 }}>
              <StepHead n={2} label="Choisir un cordage" />
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {STRINGS.map(str => (
                  <div key={str.id} className={`hov ${draft.stringId===str.id ? "sel" : ""}`}
                    style={{ ...G.card, padding:"12px 16px", display:"flex", alignItems:"center", gap:12 }}
                    onClick={() => setDraft(d => ({...d, stringId:str.id, colorId:null, tension:str.tension.rec}))}>
                    <div style={{ display:"flex", gap:3 }}>
                      {str.colors.slice(0,3).map(c => (
                        <div key={c.id} style={{ width:11, height:11, borderRadius:"50%", background: c.hex2 ? `linear-gradient(135deg,${c.hex} 50%,${c.hex2} 50%)` : c.hex, border:"1.5px solid rgba(255,255,255,0.2)" }} />
                      ))}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:14 }}>{str.brand} {str.name}</div>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,0.38)" }}>{str.gauge} · {str.type}</div>
                    </div>
                    <div style={{ fontWeight:800, color:"#00d4aa", marginRight:4 }}>{str.price}€</div>
                    {draft.stringId===str.id && <CheckCircle size={16} color="#00d4aa" />}
                  </div>
                ))}
              </div>
              <div style={{ textAlign:"center", marginTop:10 }}>
                <span style={{ fontSize:12, color:"rgba(255,255,255,0.35)", cursor:"pointer" }} onClick={() => setPage("catalog")}>
                  Voir les fiches détaillées →
                </span>
              </div>
            </div>

            {/* Step 3 – tension (only if string chosen) */}
            {selStr && (
              <div style={{ ...G.card, padding:26, marginBottom:16 }}>
                <StepHead n={3} label={`Tension — ${draft.tension} kg`} />
                <input type="range" min={selStr.tension.min} max={selStr.tension.max} value={draft.tension}
                  onChange={e => setDraft(d => ({...d, tension:+e.target.value}))}
                  style={{ width:"100%", accentColor:"#00d4aa", marginBottom:8 }} />
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"rgba(255,255,255,0.38)" }}>
                  <span>{selStr.tension.min} kg (souple)</span>
                  <span style={{ color:"#00d4aa", fontWeight:700 }}>Conseillé: {selStr.tension.rec} kg</span>
                  <span>{selStr.tension.max} kg (tendu)</span>
                </div>
                {draft.tension <= selStr.tension.rec - 3 &&
                  <div style={{ marginTop:10, padding:"8px 12px", background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:8, fontSize:12, color:"#f59e0b" }}>
                    ⚡ Tension basse → plus de puissance, moins de contrôle
                  </div>}
                {draft.tension >= selStr.tension.rec + 3 &&
                  <div style={{ marginTop:10, padding:"8px 12px", background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.3)", borderRadius:8, fontSize:12, color:"#818cf8" }}>
                    🎯 Tension haute → plus de contrôle, moins de puissance
                  </div>}
              </div>
            )}

            {/* Step 4 – color */}
            {selStr && (
              <div style={{ ...G.card, padding:26, marginBottom:16 }}>
                <StepHead n={4} label="Couleur du cordage" />
                {selStr.type === "Hybride" && (
                  <div style={{ marginBottom:12, padding:"8px 12px", background:"rgba(168,85,247,0.1)", border:"1px solid rgba(168,85,247,0.3)", borderRadius:8, fontSize:12, color:"#a855f7" }}>
                    🎨 Cordage hybride — deux couleurs différentes (mains + transversales)
                  </div>
                )}
                <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                  {selStr.colors.map(c => {
                    const sel = draft.colorId === c.id;
                    return (
                      <div key={c.id} onClick={() => setDraft(d => ({...d, colorId:c.id}))}
                        style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:7, cursor:"pointer", padding:"10px 14px", borderRadius:12,
                          background: sel ? "rgba(0,212,170,0.1)" : "rgba(255,255,255,0.04)",
                          border: `2px solid ${sel ? "#00d4aa" : "rgba(255,255,255,0.1)"}`, transition:"all .2s" }}>
                        {c.hex2 ? (
                          <div style={{ width:36, height:36, borderRadius:"50%", background:`linear-gradient(135deg,${c.hex} 50%,${c.hex2} 50%)`, border:"3px solid rgba(255,255,255,0.15)", position:"relative" }}>
                            {sel && <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:"2px solid #00d4aa" }} />}
                          </div>
                        ) : (
                          <div style={{ width:36, height:36, borderRadius:"50%", background:c.hex, border:`3px solid ${sel ? "#00d4aa" : "rgba(255,255,255,0.15)"}` }} />
                        )}
                        <span style={{ fontSize:12, fontWeight: sel ? 700 : 400, color: sel ? "#00d4aa" : "rgba(255,255,255,0.6)", textAlign:"center", lineHeight:1.3 }}>{c.name}</span>
                        {sel && <CheckCircle size={14} color="#00d4aa" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 5 – delivery mode */}
            <div style={{ ...G.card, padding:26, marginBottom:16 }}>
              <StepHead n={5} label="Mode de cordage" />
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {DELIVERY_MODES.map(m => {
                  const price = 21 + m.delta;
                  const selected = draft.deliveryMode === m.id;
                  return (
                    <div key={m.id} className={`hov ${selected ? "sel" : ""}`}
                      style={{ ...G.card, padding:"14px 18px", display:"flex", alignItems:"center", gap:14, cursor:"pointer" }}
                      onClick={() => setDraft(d => ({...d, deliveryMode:m.id}))}>
                      <span style={{ fontSize:22 }}>{m.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                          <span style={{ fontWeight:700, fontSize:15 }}>{m.label}</span>
                          {m.delta !== 0 && (
                            <span style={{ fontSize:11, fontWeight:800, padding:"2px 8px", borderRadius:100,
                              background: m.delta > 0 ? "rgba(245,158,11,0.15)" : "rgba(0,212,170,0.15)",
                              color: m.delta > 0 ? "#f59e0b" : "#00d4aa" }}>
                              {m.delta > 0 ? `+${m.delta}€` : `${m.delta}€`}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize:12, color:"rgba(255,255,255,0.42)" }}>{m.desc}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontFamily:"'Barlow Condensed'", fontSize:26, fontWeight:900, color: m.delta < 0 ? "#00d4aa" : m.delta > 0 ? "#f59e0b" : "white" }}>
                          {price}€
                        </div>
                        <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>{m.delay}</div>
                      </div>
                      {selected && <CheckCircle size={16} color="#00d4aa" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 6 – notes */}
            <div style={{ ...G.card, padding:26, marginBottom:24 }}>
              <StepHead n={6} label="Notes (optionnel)" active={false} />
              <textarea className="input" placeholder="Informations pour le cordeur (état des œillets, demande spéciale…)"
                style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, color:"white", padding:"12px 16px", width:"100%", fontFamily:"inherit" }}
                value={draft.notes} onChange={e => setDraft(d => ({...d, notes:e.target.value}))} />
            </div>

            {/* Recap */}
            {draft.racket && selStr && (() => {
              const mode = DELIVERY_MODES.find(m => m.id === draft.deliveryMode);
              const total = 21 + mode.delta;
              return (
                <div style={{ padding:"20px 22px", background:"rgba(0,212,170,0.07)", border:"1px solid rgba(0,212,170,0.22)", borderRadius:14, marginBottom:20 }}>
                  <div style={{ fontWeight:700, color:"#00d4aa", marginBottom:12 }}>📋 Récapitulatif</div>
                  {[["Raquette",draft.racket],["Cordage",`${selStr.brand} ${selStr.name}`],["Tension",`${draft.tension} kg`],["Couleur", draft.colorId ? selStr.colors.find(c=>c.id===draft.colorId)?.name ?? "—" : "Non sélectionnée"],["Mode",`${mode.icon} ${mode.label}`]].map(([k,v]) => (
                    <div key={k} style={{ display:"flex", justifyContent:"space-between", fontSize:14, marginBottom:6 }}>
                      <span style={{ color:"rgba(255,255,255,0.5)" }}>{k}</span><span style={{ fontWeight:600 }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ borderTop:"1px solid rgba(255,255,255,0.08)", marginTop:10, paddingTop:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ color:"rgba(255,255,255,0.5)", fontSize:14 }}>Total cordage</span>
                    <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
                      {mode.delta !== 0 && <span style={{ fontSize:13, color:"rgba(255,255,255,0.35)", textDecoration:"line-through" }}>21€</span>}
                      <span style={{ fontFamily:"'Barlow Condensed'", fontSize:28, fontWeight:900, color: mode.delta < 0 ? "#00d4aa" : mode.delta > 0 ? "#f59e0b" : "white" }}>{total}€</span>
                    </div>
                  </div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.3)", marginTop:6 }}>+ main d'œuvre · Paiement en magasin au retrait</div>
                </div>
              );
            })()}

            <Btn style={{ width:"100%", padding:18, fontSize:16 }} onClick={() => {
              if (!user) { setPage("login"); notify("Connectez-vous pour commander","err"); }
              else submitOrder();
            }}>
              {user ? "Valider la demande de cordage →" : "Se connecter pour commander →"}
            </Btn>
          </div>
        )}

        {/* ════════════════════════════════ LOGIN ══════════════════════════════ */}
        {page === "login" && (
          <div className="fade" style={{ maxWidth:400, margin:"60px auto 0" }}>
            <h1 style={{ fontFamily:"'Barlow Condensed'", fontSize:44, fontWeight:900, marginBottom:6 }}>CONNEXION</h1>
            <p style={{ color:"rgba(255,255,255,0.5)", marginBottom:28 }}>Accédez à votre espace client</p>
            <div style={{ ...G.card, padding:30, display:"flex", flexDirection:"column", gap:14 }}>
              <Input type="email" placeholder="Email" value={loginF.email} onChange={e => setLoginF(f => ({...f, email:e.target.value}))}
                onKeyDown={e => e.key==="Enter" && doLogin()} />
              <Input type="password" placeholder="Mot de passe" value={loginF.password} onChange={e => setLoginF(f => ({...f, password:e.target.value}))}
                onKeyDown={e => e.key==="Enter" && doLogin()} />
              {authErr && <div style={{ color:"#ef4444", fontSize:13 }}>{authErr}</div>}
              <Btn style={{ width:"100%" }} onClick={doLogin}>Se connecter</Btn>
              <div style={{ textAlign:"center", fontSize:13, color:"rgba(255,255,255,0.4)" }}>
                Pas de compte ?{" "}
                <span style={{ color:"#00d4aa", cursor:"pointer", fontWeight:700 }} onClick={() => { setPage("register"); setAuthErr(""); }}>Créer un compte</span>

              <div style={{ textAlign:"center", fontSize:13, color:"rgba(255,255,255,0.4)", marginTop:8 }}>
                <span style={{ color:"rgba(255,255,255,0.6)", cursor:"pointer", textDecoration:"underline" }} onClick={() => { setPage("forgot"); setForgotMsg(null); setForgotEmail(""); }}>Mot de passe oublié ?</span>
              </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════ REGISTER ══════════════════════════════ */}
        {page === "forgot" && (
          <div className="fade" style={{ maxWidth:400, margin:"60px auto 0" }}>
            <h1 style={{ fontFamily:"'Barlow Condensed'", fontSize:44, fontWeight:900, marginBottom:6 }}>MOT DE PASSE OUBLIÉ</h1>
            <p style={{ color:"rgba(255,255,255,0.5)", marginBottom:28 }}>Recevez un nouveau mot de passe par email</p>
            <div style={{ ...G.card, padding:30, display:"flex", flexDirection:"column", gap:14 }}>
              <Input type="email" placeholder="Votre adresse email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                onKeyDown={e => e.key==="Enter" && doForgotPassword()} />
              {forgotMsg && <div style={{ color:forgotMsg.ok?"#00d4aa":"#ef4444", fontSize:13, textAlign:"center" }}>{forgotMsg.text}</div>}
              <Btn style={{ width:"100%" }} onClick={doForgotPassword}>Envoyer le nouveau mot de passe</Btn>
              <div style={{ textAlign:"center", fontSize:13, color:"rgba(255,255,255,0.4)" }}>
                <span style={{ color:"#00d4aa", cursor:"pointer", fontWeight:700 }} onClick={() => { setPage("login"); setForgotMsg(null); setForgotEmail(""); }}>â Retour à la connexion</span>
              </div>
            </div>
          </div>
        )}

        {page === "register" && (
          <div className="fade" style={{ maxWidth:400, margin:"60px auto 0" }}>
            <h1 style={{ fontFamily:"'Barlow Condensed'", fontSize:44, fontWeight:900, marginBottom:6 }}>CRÉER UN COMPTE</h1>
            <p style={{ color:"rgba(255,255,255,0.5)", marginBottom:28 }}>Rejoignez DC.SPORTS</p>
            <div style={{ ...G.card, padding:30, display:"flex", flexDirection:"column", gap:14 }}>
              <Input placeholder="Nom complet" value={regF.name} onChange={e => setRegF(f => ({...f, name:e.target.value}))} />
              <Input type="email" placeholder="Email" value={regF.email} onChange={e => setRegF(f => ({...f, email:e.target.value}))} />
              <Input type="password" placeholder="Mot de passe" value={regF.password} onChange={e => setRegF(f => ({...f, password:e.target.value}))}
                onKeyDown={e => e.key==="Enter" && doRegister()} />
              {authErr && <div style={{ color:"#ef4444", fontSize:13 }}>{authErr}</div>}
              <Btn style={{ width:"100%" }} onClick={doRegister}>Créer mon compte</Btn>
              <div style={{ textAlign:"center", fontSize:13, color:"rgba(255,255,255,0.4)" }}>
                Déjà un compte ?{" "}
                <span style={{ color:"#00d4aa", cursor:"pointer", fontWeight:700 }} onClick={() => { setPage("login"); setAuthErr(""); }}>Se connecter</span>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════ ACCOUNT ══════════════════════════════ */}
        {page === "account" && user && (
          <div className="fade">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28 }}>
              <div>
                <h1 style={{ fontFamily:"'Barlow Condensed'", fontSize:44, fontWeight:900, marginBottom:4 }}>MON ESPACE</h1>
                <p style={{ color:"rgba(255,255,255,0.5)" }}>Bonjour {user.name} 👋</p>
              </div>
              <Btn variant="sec" style={{ padding:"9px 16px", fontSize:13, display:"flex", alignItems:"center", gap:6 }} onClick={doLogout}>
                <LogOut size={13} /> Déconnexion
              </Btn>
            </div>

            {/* Ready alert */}
            {hasReady && (
              <div style={{ padding:"18px 22px", background:"rgba(0,212,170,0.1)", border:"1px solid rgba(0,212,170,0.38)", borderRadius:14, marginBottom:24, display:"flex", alignItems:"center", gap:14 }}>
                <span style={{ fontSize:30 }}>🔔</span>
                <div>
                  <div style={{ fontWeight:800, color:"#00d4aa", marginBottom:2 }}>Votre raquette est prête !</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,0.55)" }}>Venez la récupérer pendant les heures d'ouverture.</div>
                </div>
              </div>
            )}

            <Btn style={{ marginBottom:28, display:"inline-flex", alignItems:"center", gap:8 }} onClick={() => setPage("order")}>
              + Nouvelle demande de cordage
            </Btn>

            <h2 style={{ fontFamily:"'Barlow Condensed'", fontSize:26, fontWeight:800, marginBottom:14 }}>MES COMMANDES</h2>

            {myOrders.length === 0 ? (
              <div style={{ ...G.card, padding:44, textAlign:"center", color:"rgba(255,255,255,0.38)" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>🏸</div>
                <div>Aucune commande pour l'instant</div>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {[...myOrders].reverse().map(o => (
                  <div key={o.id} style={{ ...G.card, padding:22 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10, flexWrap:"wrap", gap:8 }}>
                      <div>
                        <div style={{ fontWeight:700, fontSize:16 }}>{o.racket}</div>
                        <div style={{ fontSize:13, color:"rgba(255,255,255,0.48)", marginTop:2 }}>
                          {o.string.brand} {o.string.name} · {o.tension} kg
                          {o.colorId && (() => {
                            const c = o.string.colors?.find(c => c.id === o.colorId);
                            return c ? (
                              <span style={{ display:"inline-flex", alignItems:"center", gap:5, marginLeft:6 }}>
                                · <div style={{ display:"inline-block", width:10, height:10, borderRadius:"50%", background: c.hex2 ? `linear-gradient(135deg,${c.hex} 50%,${c.hex2} 50%)` : c.hex, border:"1.5px solid rgba(255,255,255,0.3)", verticalAlign:"middle" }} /> {c.name}
                              </span>
                            ) : null;
                          })()}
                        </div>
                      </div>
                      <Badge status={o.status} />
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"rgba(255,255,255,0.35)" }}>
                      <span>{new Date(o.createdAt).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})}</span>
                      <span style={{ color:"#00d4aa", fontWeight:700 }}>{o.string.price}€ + MO</span>
                    </div>
                    {o.status === "ready" && (
                      <div style={{ marginTop:10, padding:"8px 12px", background:"rgba(0,212,170,0.1)", borderRadius:8, fontSize:12, color:"#00d4aa" }}>
                        ✅ Prête depuis le {new Date(o.updatedAt).toLocaleDateString("fr-FR")} — Paiement en magasin lors du retrait
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════ ADMIN ════════════════════════════════ */}
        {page === "admin" && !isAdmin && (
          <div className="fade" style={{ maxWidth:380, margin:"80px auto 0" }}>
            <h1 style={{ fontFamily:"'Barlow Condensed'", fontSize:38, fontWeight:900, marginBottom:6 }}>ACCÈS ADMIN</h1>
            <div style={{ ...G.card, padding:28, display:"flex", flexDirection:"column", gap:14 }}>
              <Input type="password" placeholder="Code admin" value={adminPwd} onChange={e => setAdminPwd(e.target.value)}
                onKeyDown={e => { if(e.key==="Enter") { if(adminPwd===ADMIN_CODE) { setIsAdmin(true); localStorage.setItem('dcsports_isAdmin','true') } else notify("Code incorrect","err"); }}} />
              <Btn style={{ width:"100%" }} onClick={() => { if(adminPwd===ADMIN_CODE) { setIsAdmin(true); localStorage.setItem('dcsports_isAdmin','true') } else notify("Code incorrect","err"); }}>
                Accéder
              </Btn>
            </div>
          </div>
        )}

        {page === "admin" && isAdmin && (
          <div className="fade">
            {/* Header */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28, flexWrap:"wrap", gap:16 }}>
              <div>
                <h1 style={{ fontFamily:"'Barlow Condensed'", fontSize:44, fontWeight:900, marginBottom:4 }}>PANNEAU ADMIN</h1>
                <p style={{ color:"rgba(255,255,255,0.5)" }}>DC.SPORTS — Gestion des cordages</p>
              </div>
              <div style={{ display:"flex", gap:12 }}>
                {[
                  [orders.filter(o=>o.status==="pending").length,  "En attente","#f59e0b"],
                  [orders.filter(o=>o.status==="stringing").length,"En cours",  "#60a5fa"],
                  [orders.filter(o=>o.status==="ready").length,    "Prêtes",    "#00d4aa"],
                ].map(([v,l,c],i) => (
                  <div key={i} style={{ ...G.card, padding:"12px 18px", textAlign:"center" }}>
                    <div style={{ fontFamily:"'Barlow Condensed'", fontSize:30, fontWeight:900, color:c }}>{v}</div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)" }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            
            {/* ── Onglets Admin ── */}
            <div style={{ display:"flex", gap:0, marginTop:24, marginBottom:20, borderBottom:"1px solid rgba(255,255,255,0.12)" }}>
              {[["commandes","📋 Commandes"],["clients","👥 Clients"]].map(([key,label]) => (
                <button key={key} onClick={() => setAdminTab(key)}
                  style={{ background:"none", border:"none", cursor:"pointer", padding:"10px 22px", fontWeight:700, fontSize:13, fontFamily:"'Barlow Condensed'", letterSpacing:1,
                    color: adminTab===key ? "#00d4aa" : "rgba(255,255,255,0.4)",
                    borderBottom: adminTab===key ? "2px solid #00d4aa" : "2px solid transparent",
                    transition:"all 0.2s" }}>
                  {label}
                </button>
              ))}
            </div>

            {/* ── Onglet Commandes ── */}
            {adminTab === "commandes" && (
              <div>
                {orders.length === 0 ? (
              <div style={{ ...G.card, padding:44, textAlign:"center", color:"rgba(255,255,255,0.38)" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
                <div>Aucune commande pour l'instant</div>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {[...orders].reverse().map(o => (
                  <div key={o.id} style={{ ...G.card, padding:22 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
                      <div style={{ flex:1, minWidth:220 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6, flexWrap:"wrap" }}>
                          <span style={{ fontWeight:800, fontSize:16 }}>{o.userName}</span>
                          <Badge status={o.status} />
                        </div>
                        <div style={{ fontSize:15, marginBottom:3 }}>🏸 {o.racket}</div>
                        <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                          {o.string.brand} {o.string.name} · {o.tension} kg · {o.string.price}€
                          {o.colorId && (() => {
                            const c = o.string.colors?.find(c => c.id === o.colorId);
                            return c ? (
                              <span style={{ display:"inline-flex", alignItems:"center", gap:5 }}>
                                · <div style={{ width:12, height:12, borderRadius:"50%", background: c.hex2 ? `linear-gradient(135deg,${c.hex} 50%,${c.hex2} 50%)` : c.hex, border:"1.5px solid rgba(255,255,255,0.3)", flexShrink:0 }} />
                                <strong style={{ color:"white" }}>{c.name}</strong>
                              </span>
                            ) : null;
                          })()}
                        </div>
                        {o.notes && (
                          <div style={{ marginTop:8, padding:"7px 10px", background:"rgba(255,255,255,0.04)", borderRadius:8, fontSize:12, color:"rgba(255,255,255,0.55)", fontStyle:"italic" }}>
                            "{o.notes}"
                          </div>
                        )}
                        <div style={{ fontSize:11, color:"rgba(255,255,255,0.28)", marginTop:8 }}>
                          Reçu le {new Date(o.createdAt).toLocaleString("fr-FR")}
                        </div>
                      </div>

                      <div style={{ display:"flex", flexDirection:"column", gap:8, minWidth:170 }}>
                        {o.status === "pending" && (
                          <Btn variant="sec" style={{ padding:"10px 14px", fontSize:13 }} onClick={() => updateStatus(o.id,"stringing")}>
                            ⚡ Commencer le cordage
                          </Btn>
                        )}
                        {o.status === "stringing" && (
                          <Btn style={{ padding:"10px 14px", fontSize:13 }} onClick={() => updateStatus(o.id,"ready")}>
                            ✅ Marquer prête + notifier
                          </Btn>
                        )}
                        {o.status === "ready" && (
                          <div style={{ padding:"10px 14px", background:"rgba(0,212,170,0.08)", border:"1px solid rgba(0,212,170,0.28)", borderRadius:10, fontSize:12, color:"#00d4aa", textAlign:"center", fontWeight:700 }}>
                            🔔 Client notifié
                          </div>
                        )}

                        {o.status === "ready" && (
                          <Btn style={{ padding:"8px 14px", fontSize:12, background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.4)", color:"#f87171", marginTop:8 }}
                            onClick={() => doDeleteOrder(o.id)}>
                            🗑 Supprimer
                          </Btn>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
              </div>
            )}

            {/* ── Onglet Clients ── */}
            {adminTab === "clients" && (
              <div>
                {users.length === 0 ? (
                  <div style={{ ...G.card, padding:44, textAlign:"center", color:"rgba(255,255,255,0.38)" }}>
                    <div style={{ fontSize:40, marginBottom:12 }}>👤</div>
                    <div>Aucun client inscrit</div>
                  </div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                    {[...users].sort((a,b) => (b.createdAt||"").localeCompare(a.createdAt||"")).map(u => {
                      const clientOrders = orders.filter(o => o.userEmail === u.email || o.userName === u.name);
                      return (
                        <div key={u.id} style={{ ...G.card, padding:22 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
                            <div>
                              <div style={{ fontWeight:800, fontSize:17, marginBottom:4 }}>👤 {u.name}</div>
                              <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:6 }}>✉️ {u.email}</div>
                              <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)" }}>
                                Inscrit le {u.createdAt ? new Date(u.createdAt).toLocaleDateString("fr-FR", { day:"2-digit", month:"2-digit", year:"numeric" }) : "—"}
                              </div>
                            </div>
                            <div style={{ ...G.card, padding:"8px 16px", background:"rgba(0,212,170,0.08)", border:"1px solid rgba(0,212,170,0.2)", borderRadius:10, textAlign:"center", minWidth:90 }}>
                              <div style={{ fontFamily:"'Barlow Condensed'", fontSize:26, fontWeight:900, color:"#00d4aa" }}>{clientOrders.length}</div>
                              <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)" }}>commande{clientOrders.length!==1?"s":""}</div>
                            </div>
                          </div>
                          {clientOrders.length > 0 && (
                            <div style={{ marginTop:16, borderTop:"1px solid rgba(255,255,255,0.08)", paddingTop:12 }}>
                              <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.4)", marginBottom:8, letterSpacing:1 }}>HISTORIQUE</div>
                              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                                {[...clientOrders].reverse().map(o => (
                                  <div key={o.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px", background:"rgba(255,255,255,0.04)", borderRadius:8, flexWrap:"wrap", gap:8 }}>
                                    <div>
                                      <span style={{ fontWeight:700, fontSize:13 }}>🏸 {o.racket}</span>
                                      <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginLeft:10 }}>{o.string?.brand} {o.string?.name} · {o.tension}kg · {o.string?.price}€</span>
                                    </div>
                                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                      <Badge status={o.status} />
                                      <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>
                                        {o.createdAt ? new Date(o.createdAt).toLocaleDateString("fr-FR", { day:"2-digit", month:"short" }) : ""}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════ INFO ═══════════════════════════════ */}
        {page === "info" && (
          <div className="fade">
            <h1 style={{ fontFamily:"'Barlow Condensed'", fontSize:44, fontWeight:900, marginBottom:6 }}>LE MAGASIN</h1>
            <p style={{ color:"rgba(255,255,255,0.5)", marginBottom:28 }}>Infos pratiques DC.SPORTS</p>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:18 }}>
              {/* Horaires */}
              <div style={{ ...G.card, padding:28 }}>
                <div style={{ fontFamily:"'Barlow Condensed'", fontSize:22, fontWeight:800, marginBottom:20, display:"flex", alignItems:"center", gap:8 }}>
                  <Clock size={18} color="#00d4aa" /> HORAIRES
                </div>
                {HOURS.map(({ day, h }) => {
                  const today = day === TODAY_NAME;
                  return (
                    <div key={day} style={{ display:"flex", justifyContent:"space-between", padding:"9px 12px", marginBottom:4, borderRadius:8,
                      background: today ? "rgba(0,212,170,0.09)" : "transparent",
                      border: today ? "1px solid rgba(0,212,170,0.2)" : "1px solid transparent" }}>
                      <span style={{ fontWeight: today ? 700 : 400, color: today ? "#00d4aa" : "rgba(255,255,255,0.68)" }}>
                        {day}{today ? " ← Aujourd'hui" : ""}
                      </span>
                      <span style={{ fontWeight:600, color: h==="Fermé" ? "rgba(255,255,255,0.3)" : "white" }}>{h}</span>
                    </div>
                  );
                })}
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
                {/* Contact */}
                <div style={{ ...G.card, padding:28 }}>
                  <div style={{ fontFamily:"'Barlow Condensed'", fontSize:22, fontWeight:800, marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
                    <MapPin size={18} color="#00d4aa" /> CONTACT
                  </div>
                  <div style={{ lineHeight:2, color:"rgba(255,255,255,0.7)", fontSize:15 }}>
                    📍 47 Boulevard de la gribelette 91390 Morsang-sur-Orge, Essonne <br />
                    📞 06 10 33 0 045<br />
                    🌐 dcsports.fr
                  </div>
                </div>

                {/* Cordage service */}
                <div style={{ ...G.card, padding:28 }}>
                  <div style={{ fontFamily:"'Barlow Condensed'", fontSize:22, fontWeight:800, marginBottom:16 }}>🏸 SERVICE CORDAGE</div>
                  {[["Délai","24h à 48h","#00d4aa"],["Main d'œuvre","à partir de 8€","white"],["Paiement","En magasin au retrait","white"]].map(([k,v,c]) => (
                    <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.06)", fontSize:14 }}>
                      <span style={{ color:"rgba(255,255,255,0.48)" }}>{k}</span>
                      <span style={{ fontWeight:700, color:c }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* Brands */}
                <div style={{ ...G.card, padding:28 }}>
                  <div style={{ fontFamily:"'Barlow Condensed'", fontSize:22, fontWeight:800, marginBottom:14 }}>MARQUES</div>
                  <div style={{ display:"flex", gap:10 }}>
                    {["Yonex","Victor","Li-Ning","Ashaway"].map(b => (
                      <div key={b} style={{ flex:1, padding:"12px 6px", background:"rgba(255,255,255,0.05)", borderRadius:10, textAlign:"center", fontWeight:700, fontSize:13 }}>{b}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>{/* wrap */}

      {/* ═══════════ STRING DETAIL MODAL ════════════ */}
      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.82)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:18 }}
          onClick={() => setModal(null)}>
          <div className="fade" style={{ ...G.card, maxWidth:480, width:"100%", padding:30, maxHeight:"90vh", overflowY:"auto" }}
            onClick={e => e.stopPropagation()}>

            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:22 }}>
              <div>
                <div style={{ fontSize:10, fontWeight:900, color:"#00d4aa", letterSpacing:2, marginBottom:3 }}>{modal.brand.toUpperCase()}</div>
                <div style={{ fontFamily:"'Barlow Condensed'", fontSize:36, fontWeight:900 }}>{modal.name}</div>
              </div>
              <button onClick={() => setModal(null)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.4)", fontSize:22, cursor:"pointer" }}><X size={20} /></button>
            </div>

            <p style={{ color:"rgba(255,255,255,0.68)", marginBottom:22, lineHeight:1.6, fontSize:14 }}>{modal.description}</p>

            {/* Bars */}
            <div style={{ marginBottom:22 }}>
              <div style={{ fontSize:11, fontWeight:900, color:"rgba(255,255,255,0.38)", letterSpacing:2, marginBottom:12 }}>PROFIL DE JEU</div>
              <Bar label="Durabilité"  val={modal.profile.durabilite}  color="#00d4aa" />
              <Bar label="Contrôle"    val={modal.profile.controle}    color="#60a5fa" />
              <Bar label="Vitesse"     val={modal.profile.vitesse}     color="#f59e0b" />
              <Bar label="Puissance"   val={modal.profile.puissance}   color="#ef4444" />
              <Bar label="Feeling"     val={modal.profile.feeling}     color="#a855f7" />
            </div>

            {/* Specs grid */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:22 }}>
              {[["Diamètre",modal.gauge],["Tension conseillée",`${modal.tension.rec} kg`],["Type",modal.type],["Prix",`${modal.price}€`]].map(([k,v]) => (
                <div key={k} style={{ background:"rgba(255,255,255,0.05)", borderRadius:10, padding:14 }}>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.38)", marginBottom:4 }}>{k.toUpperCase()}</div>
                  <div style={{ fontWeight:700 }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Colors */}
            <div style={{ marginBottom:22 }}>
              <div style={{ fontSize:11, fontWeight:900, color:"rgba(255,255,255,0.38)", letterSpacing:2, marginBottom:12 }}>COULEURS DISPONIBLES</div>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                {modal.colors.map(c => (
                  <div key={c.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", background:"rgba(255,255,255,0.05)", borderRadius:10 }}>
                    {c.hex2 ? (
                      <div style={{ width:22, height:22, borderRadius:"50%", background:`linear-gradient(135deg,${c.hex} 50%,${c.hex2} 50%)`, border:"2px solid rgba(255,255,255,0.2)", flexShrink:0 }} />
                    ) : (
                      <div style={{ width:22, height:22, borderRadius:"50%", background:c.hex, border:"2px solid rgba(255,255,255,0.2)", flexShrink:0 }} />
                    )}
                    <span style={{ fontSize:13, fontWeight:600 }}>{c.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Best for */}
            <div style={{ marginBottom:22 }}>
              <div style={{ fontSize:11, fontWeight:900, color:"rgba(255,255,255,0.38)", letterSpacing:2, marginBottom:10 }}>IDÉAL POUR</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {modal.bestFor.map(b => (
                  <span key={b} style={{ padding:"4px 12px", background:"rgba(0,212,170,0.1)", border:"1px solid rgba(0,212,170,0.28)", borderRadius:100, fontSize:12, color:"#00d4aa", fontWeight:700 }}>{b}</span>
                ))}
              </div>
            </div>

            <Btn style={{ width:"100%", padding:16 }} onClick={() => {
              setDraft(d => ({...d, stringId:modal.id, colorId:null, tension:modal.tension.rec}));
              setModal(null); setPage("order");
            }}>Commander ce cordage →</Btn>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop:"1px solid rgba(255,255,255,0.05)", padding:"22px 18px", textAlign:"center", color:"rgba(255,255,255,0.18)", fontSize:12, marginTop:60 }}>
        © 2025 DC.SPORTS — Morsang-sur-Orge (91) · Spécialiste Badminton Yonex · Victor · Li-Ning · Ashaway
      </div>
    </div>
  );
}

// ─── STEP HEADER ─────────────────────────────────────────────────────────────
function StepHead({ n, label, active=true }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
      <div style={{ width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:900,
        background: active ? "linear-gradient(135deg,#00d4aa,#0099ff)" : "rgba(255,255,255,0.1)" }}>{n}</div>
      <span style={{ fontWeight:700, fontSize:16 }}>{label}</span>
    </div>
  );
}
