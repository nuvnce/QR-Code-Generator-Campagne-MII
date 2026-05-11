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
CREATE TABLE IF NOT EXISTS vagues_mii (
  id               SERIAL PRIMARY KEY,
  region           VARCHAR(50) NOT NULL,
  lettres_region   VARCHAR(2)  NOT NULL,
  annee            INT NOT NULL,
  vague            INT NOT NULL,
  nb_generes       INT NOT NULL,
  id_debut         INT NOT NULL,
  id_fin           INT NOT NULL,
  genere_par       INT REFERENCES users(id),
  date_generation  TIMESTAMP DEFAULT NOW()
);

-- Index utiles
CREATE INDEX IF NOT EXISTS idx_vagues_coupons_district ON vagues_coupons(abrev_district, annee);
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
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- PnlpTogo2026!
  'admin'
) ON CONFLICT (username) DO NOTHING;
