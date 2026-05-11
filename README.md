# 🦟 QR Code Generator — Campagne MII PNLP Togo

Application web de génération de QR codes pour la campagne de distribution de Moustiquaires Imprégnées d'Insecticide (MII) — **Programme National de Lutte contre le Paludisme, Togo**.

---

## 🚀 Déploiement en 5 étapes (100% gratuit)

### 1. Base de données — Neon PostgreSQL (gratuit permanent)

1. Créer un compte sur [neon.tech](https://neon.tech)
2. Créer un nouveau projet `qr-mii-pnlp`
3. Copier la **Connection String** (format `postgresql://...`)
4. Ouvrir l'éditeur SQL Neon et coller + exécuter le contenu de `schema.sql`

### 2. Préparer le repo GitHub

```bash
git init
git add .
git commit -m "Initial commit — QR Generator Campagne MII"
git remote add origin https://github.com/TON_COMPTE/QR-Code-Generator-Campagne-MII.git
git push -u origin main
```

### 3. Déployer sur Vercel

1. Créer un compte sur [vercel.com](https://vercel.com)
2. **New Project** → Importer le repo GitHub
3. Framework : **Vite**
4. Ajouter les variables d'environnement :
   - `DATABASE_URL` = votre Connection String Neon
   - `JWT_SECRET`   = une chaîne aléatoire longue (ex: `openssl rand -hex 32`)
5. Cliquer **Deploy**

✅ L'app est live sur `https://qr-mii-pnlp.vercel.app` (URL personnalisable)

### 4. Première connexion

| Champ | Valeur |
|---|---|
| Nom d'utilisateur | `admin` |
| Mot de passe      | `PnlpTogo2026!` |

> ⚠️ **Changer le mot de passe admin immédiatement** après la première connexion via Paramètres.

### 5. Ajouter le logo PNLP (optionnel)

Uploader `logo_pnlp.png` dans le dossier `public/` — il sera automatiquement intégré dans les PDFs générés.

---

## 👥 Rôles et permissions

| Rôle | Générer coupons | Générer MII | Voir registre | Gérer agents |
|---|---|---|---|---|
| **Admin**       | ✅ | ✅ | ✅ | ✅ |
| **Superviseur** | ✅ | ✅ | ✅ | ❌ |
| **Agent**       | ✅ | ✅ | ❌ | ❌ |

---

## 🏷️ Structure des codes générés

### Coupon Ménage
```
TG-{ABREV}-{ANNEE}-V{VAGUE}-{RDDD}-{ID_6}
Exemple : TG-KLKP-2026-V1-4004-000001
```

### Code MII
```
MII-TG-{ANNEE}-V{VAGUE}{RR}-{ID_7}
Exemple : MII-TG-2026-V1PO-0000001
```

---

## ⚙️ Personnalisation des codes

Dans `src/lib/districts.json`, modifier les abréviations ou ajouter des zones.

Dans `src/pages/Coupons.jsx` et `src/pages/MII.jsx`, les structures de codes sont construites dans les fonctions `handleSubmit` et peuvent être adaptées librement.

Dans `src/lib/pdfGenerator.js`, modifier le design des coupons PDF :
- `COLS` / `ROWS` : nombre de colonnes et lignes par page
- `QR` : taille du QR code en mm
- `CHAMPS_MANUSCRITS` : champs à remplir au stylo

---

## 🔧 Développement local

```bash
npm install
vercel dev       # Lance frontend + API Vercel en local
```

Ou sans Vercel CLI :
```bash
npm run dev      # Frontend seulement (les appels API échoueront sans backend)
```

---

## 📁 Structure du projet

```
qr-mii-app/
├── api/                     ← Fonctions serverless Vercel
│   ├── auth/login.js        ← Authentification JWT
│   ├── generate/coupons.js  ← Génération codes coupons
│   ├── generate/mii.js      ← Génération codes MII
│   ├── registre/index.js    ← Historique & stats
│   ├── users/index.js       ← Gestion agents
│   └── _middleware/auth.js  ← Guard JWT partagé
├── src/
│   ├── pages/               ← Login, Dashboard, Coupons, MII, Registre, Paramètres
│   ├── components/layout/   ← Sidebar + Layout principal
│   └── lib/
│       ├── api.js            ← Client axios + intercepteur JWT
│       ├── pdfGenerator.js   ← Génération PDF + Excel côté client
│       └── districts.json    ← Table régions/districts Togo
├── public/                   ← Logo PNLP et assets statiques
├── schema.sql                ← Script initialisation base Neon
└── vercel.json               ← Config déploiement Vercel
```

---

## 📄 Licence

Usage institutionnel PNLP Togo. Libre d'adaptation pour tout programme national de santé publique.

*Stack : React • Vite • TailwindCSS • Vercel Serverless • Neon PostgreSQL • jsPDF • QRCode.js*
