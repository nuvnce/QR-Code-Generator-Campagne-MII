// api/users/index.js
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { verifyToken } from '../_middleware/auth.js';

export default async function handler(req, res) {
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Non authentifié' });

  const sql = neon(process.env.DATABASE_URL);

  // GET — liste des agents (admin + superviseur)
  if (req.method === 'GET') {
    if (!['admin', 'superviseur'].includes(user.role))
      return res.status(403).json({ error: 'Accès refusé' });
    try {
      const users = await sql`
        SELECT id, username, nom, role, actif, derniere_connexion, created_at
        FROM users ORDER BY created_at DESC
      `;
      return res.status(200).json(users);
    } catch (err) {
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  // POST — créer un agent (admin seulement)
  if (req.method === 'POST') {
    if (user.role !== 'admin') return res.status(403).json({ error: 'Admin requis' });
    const { username, nom, password, role } = req.body;
    if (!username || !nom || !password || !role)
      return res.status(400).json({ error: 'Champs requis' });
    if (!['admin', 'superviseur', 'agent'].includes(role))
      return res.status(400).json({ error: 'Rôle invalide' });
    try {
      const hash = await bcrypt.hash(password, 10);
      const result = await sql`
        INSERT INTO users (username, nom, password_hash, role)
        VALUES (${username}, ${nom}, ${hash}, ${role})
        RETURNING id, username, nom, role
      `;
      return res.status(201).json(result[0]);
    } catch (err) {
      if (err.message.includes('unique')) return res.status(409).json({ error: 'Nom d\'utilisateur déjà pris' });
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  // PATCH — modifier actif/role (admin seulement)
  if (req.method === 'PATCH') {
    if (user.role !== 'admin') return res.status(403).json({ error: 'Admin requis' });
    const { id, actif, role } = req.body;
    try {
      await sql`
        UPDATE users SET
          actif = COALESCE(${actif ?? null}, actif),
          role  = COALESCE(${role  ?? null}, role)
        WHERE id = ${id}
      `;
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  }

  res.status(405).end();
}
