-- =============================================================
-- SCHEMA NEON POSTGRESQL — QR Code Generator Campagne MII
-- PNLP Togo
-- Exécuter une seule fois sur votre base Neon
-- =============================================================

-- Table utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id                 SERIAL PRIMARY KEY,
  username           VARCHAR(50) UNIQUE NOT NULL,
  nom                VARCHAR(100) NOT NULL,
  password_hash      TEXT NOT NULL,
  role               VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'superviseur', 'agent')),
  actif              BOOLEAN DEFAULT TRUE,
  derniere_connexion TIMESTAMP,
  created_at         TIMESTAMP DEFAULT NOW()
);

-- Table vagues coupons ménage
CREATE TABLE IF NOT EXISTS vagues_coupons (
  id               SERIAL PRIMARY KEY,
  region           VARCHAR(50) NOT NULL,
  district         VARCHAR(50) NOT NULL,
  abrev_district   VARCHAR(4)  NOT NULL,
  rddd             VARCHAR(4)  NOT NULL,
  annee            INT NOT NULL,
  vague            INT NOT NULL,
  nb_generes       INT NOT NULL,
  id_debut         INT NOT NULL,
  id_fin           INT NOT NULL,
  genere_par       INT REFERENCES users(id),
  date_generation  TIMESTAMP DEFAULT NOW()
);

-- Table vagues MII
-- Format code : (21) 25181XXYYNNNNNNNNN
--   XX = lettres_region (2L), YY = lettres_district (2L)
--   NNNNNNNN = ID séquentiel 8 chiffres, repart à 1 par district
CREATE TABLE IF NOT EXISTS vagues_mii (
  id                SERIAL PRIMARY KEY,
  region            VARCHAR(50) NOT NULL,
  district          VARCHAR(50) NOT NULL,
  lettres_region    VARCHAR(2)  NOT NULL,
  lettres_district  VARCHAR(2)  NOT NULL,
  segment_geo       VARCHAR(4)  NOT NULL,
  annee             INT NOT NULL,
  vague             INT NOT NULL,
  nb_generes        INT NOT NULL,
  id_debut          INT NOT NULL,
  id_fin            INT NOT NULL,
  genere_par        INT REFERENCES users(id),
  date_generation   TIMESTAMP DEFAULT NOW()
);

-- Index utiles
CREATE INDEX IF NOT EXISTS idx_vagues_coupons_district ON vagues_coupons(abrev_district, annee);
CREATE INDEX IF NOT EXISTS idx_vagues_mii_district     ON vagues_mii(district, annee);
CREATE INDEX IF NOT EXISTS idx_vagues_mii_region       ON vagues_mii(region, annee);

-- =============================================================
-- Compte admin par défaut
-- username: admin | password: PnlpTogo2026!
-- ⚠️ CHANGER LE MOT DE PASSE après première connexion
-- =============================================================
INSERT INTO users (username, nom, password_hash, role)
VALUES (
  'admin',
  'Administrateur PNLP',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'admin'
) ON CONFLICT (username) DO NOTHING;

-- =============================================================
-- MIGRATION — Si la table vagues_mii existe déjà (ancienne version)
-- Exécuter ces commandes séparément si nécessaire :
-- =============================================================
-- ALTER TABLE vagues_mii ADD COLUMN IF NOT EXISTS district VARCHAR(50);
-- ALTER TABLE vagues_mii ADD COLUMN IF NOT EXISTS lettres_district VARCHAR(2);
-- ALTER TABLE vagues_mii ADD COLUMN IF NOT EXISTS segment_geo VARCHAR(4);
-- UPDATE vagues_mii SET district = region, lettres_district = 'XX', segment_geo = lettres_region || 'XX' WHERE district IS NULL;
