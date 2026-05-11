// api/generate/mii.js
import { neon } from '@neondatabase/serverless';
import { verifyToken } from '../_middleware/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Non authentifié' });
  if (!['admin', 'superviseur', 'agent'].includes(user.role))
    return res.status(403).json({ error: 'Accès refusé' });

  const { region, lettres_region, annee, nb_codes } = req.body;
  if (!region || !lettres_region || !annee || !nb_codes)
    return res.status(400).json({ error: 'Paramètres manquants' });

  if (nb_codes > 100000)
    return res.status(400).json({ error: 'Maximum 100 000 codes par génération' });

  try {
    const sql = neon(process.env.DATABASE_URL);

    const vagues = await sql`
      SELECT COUNT(*) as nb, COALESCE(SUM(nb_generes), 0) as total
      FROM vagues_mii
      WHERE region = ${region} AND annee = ${annee}
    `;
    const numeroVague = parseInt(vagues[0].nb) + 1;
    const idDebut     = parseInt(vagues[0].total) + 1;
    const segmentVR   = `V${numeroVague}${lettres_region}`;

    const codes = [];
    for (let i = 0; i < nb_codes; i++) {
      const id = idDebut + i;
      codes.push(
        `MII-TG-${annee}-${segmentVR}-${String(id).padStart(7, '0')}`
      );
    }

    await sql`
      INSERT INTO vagues_mii
        (region, lettres_region, annee, vague, nb_generes, id_debut, id_fin, genere_par, date_generation)
      VALUES
        (${region}, ${lettres_region}, ${annee}, ${numeroVague},
         ${nb_codes}, ${idDebut}, ${idDebut + nb_codes - 1}, ${user.id}, NOW())
    `;

    res.status(200).json({
      success: true,
      vague: numeroVague,
      segment: segmentVR,
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
