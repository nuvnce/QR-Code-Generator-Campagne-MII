// api/generate/coupons.js
import { neon } from '@neondatabase/serverless';
import { verifyToken } from '../_middleware/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Non authentifié' });
  // Tous les rôles peuvent générer
  if (!['admin', 'superviseur', 'agent'].includes(user.role))
    return res.status(403).json({ error: 'Accès refusé' });

  const { region, district, abrev, rddd, annee, nb_codes } = req.body;
  if (!region || !district || !abrev || !rddd || !annee || !nb_codes)
    return res.status(400).json({ error: 'Paramètres manquants' });

  if (nb_codes > 50000)
    return res.status(400).json({ error: 'Maximum 50 000 codes par génération' });

  try {
    const sql = neon(process.env.DATABASE_URL);

    // Calcul numéro de vague
    const vagues = await sql`
      SELECT COUNT(*) as nb, COALESCE(SUM(nb_generes), 0) as total
      FROM vagues_coupons
      WHERE abrev_district = ${abrev} AND annee = ${annee}
    `;
    const numeroVague = parseInt(vagues[0].nb) + 1;
    const idDebut     = parseInt(vagues[0].total) + 1;

    // Génération des codes
    const codes = [];
    for (let i = 0; i < nb_codes; i++) {
      const id = idDebut + i;
      codes.push(
        `TG-${abrev}-${annee}-V${numeroVague}-${rddd}-${String(id).padStart(6, '0')}`
      );
    }

    // Enregistrement dans la BDD
    await sql`
      INSERT INTO vagues_coupons
        (region, district, abrev_district, rddd, annee, vague, nb_generes, id_debut, id_fin, genere_par, date_generation)
      VALUES
        (${region}, ${district}, ${abrev}, ${rddd}, ${annee}, ${numeroVague},
         ${nb_codes}, ${idDebut}, ${idDebut + nb_codes - 1}, ${user.id}, NOW())
    `;

    res.status(200).json({
      success: true,
      vague: numeroVague,
      id_debut: idDebut,
      nb_codes,
      codes,
      exemple: codes[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la génération' });
  }
}
