// api/registre/index.js
import { neon } from '@neondatabase/serverless';
import { verifyToken } from '../_middleware/auth.js';

export default async function handler(req, res) {
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Non authentifié' });

  const sql = neon(process.env.DATABASE_URL);

  if (req.method === 'GET') {
    const { type = 'all' } = req.query;
    try {
      let coupons = [], mii = [];

      if (type === 'all' || type === 'coupons') {
        coupons = await sql`
          SELECT vc.*, u.nom as agent_nom
          FROM vagues_coupons vc
          LEFT JOIN users u ON vc.genere_par = u.id
          ORDER BY vc.date_generation DESC
        `;
      }
      if (type === 'all' || type === 'mii') {
        mii = await sql`
          SELECT vm.*, u.nom as agent_nom
          FROM vagues_mii vm
          LEFT JOIN users u ON vm.genere_par = u.id
          ORDER BY vm.date_generation DESC
        `;
      }

      const stats = await sql`
        SELECT
          (SELECT COALESCE(SUM(nb_generes),0) FROM vagues_coupons) as total_coupons,
          (SELECT COALESCE(SUM(nb_generes),0) FROM vagues_mii)     as total_mii,
          (SELECT COUNT(*) FROM vagues_coupons)                    as nb_vagues_coupons,
          (SELECT COUNT(*) FROM vagues_mii)                        as nb_vagues_mii
      `;

      res.status(200).json({ coupons, mii, stats: stats[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  } else {
    res.status(405).end();
  }
}
