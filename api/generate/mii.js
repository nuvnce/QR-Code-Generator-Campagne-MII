// api/generate/mii.js
// Format code : (21) 25181XXYYNNNNNNNNN
//   (21)    = Application Identifier GS1 — fixe
//   25181   = Préfixe fabricant — fixe
//   XX      = 2 lettres région
//   YY      = 2 lettres district
//   NNNNNNNN= ID séquentiel 8 chiffres — repart à 1 par district
import { neon } from '@neondatabase/serverless';
import { verifyToken } from '../_middleware/auth.js';

const GS1_AI           = '(21)';
const PREFIXE_FABRICANT = '25181';
const NB_CHIFFRES_ID   = 8;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Non authentifié' });
  if (!['admin', 'superviseur', 'agent'].includes(user.role))
    return res.status(403).json({ error: 'Accès refusé' });

  const { region, district, lettres_region, lettres_district, annee, nb_codes } = req.body;
  if (!region || !district || !lettres_region || !lettres_district || !annee || !nb_codes)
    return res.status(400).json({ error: 'Paramètres manquants' });

  if (nb_codes > 100000)
    return res.status(400).json({ error: 'Maximum 100 000 codes par génération' });

  // Segment géo = 4 lettres (2 région + 2 district)
  const segmentGeo = `${lettres_region}${lettres_district}`;

  try {
    const sql = neon(process.env.DATABASE_URL);

    // Calcul vague + ID de départ — unicité par district
    const vagues = await sql`
      SELECT COUNT(*) as nb, COALESCE(SUM(nb_generes), 0) as total
      FROM vagues_mii
      WHERE district = ${district} AND annee = ${annee}
    `;
    const numeroVague = parseInt(vagues[0].nb) + 1;
    const idDebut     = parseInt(vagues[0].total) + 1;

    // Génération des codes
    const codes = [];
    for (let i = 0; i < nb_codes; i++) {
      const id = idDebut + i;
      codes.push(
        `${GS1_AI} ${PREFIXE_FABRICANT}${segmentGeo}${String(id).padStart(NB_CHIFFRES_ID, '0')}`
      );
    }

    // Enregistrement en BDD
    await sql`
      INSERT INTO vagues_mii
        (region, district, lettres_region, lettres_district, segment_geo,
         annee, vague, nb_generes, id_debut, id_fin, genere_par, date_generation)
      VALUES
        (${region}, ${district}, ${lettres_region}, ${lettres_district}, ${segmentGeo},
         ${annee}, ${numeroVague}, ${nb_codes},
         ${idDebut}, ${idDebut + nb_codes - 1}, ${user.id}, NOW())
    `;

    res.status(200).json({
      success:    true,
      vague:      numeroVague,
      segment:    segmentGeo,
      id_debut:   idDebut,
      nb_codes,
      codes,
      exemple:    codes[0],
      dernier:    codes[codes.length - 1]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la génération' });
  }
}
