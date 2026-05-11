// api/auth/login.js
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Champs requis' });

  try {
    const sql = neon(process.env.DATABASE_URL);
    const users = await sql`SELECT * FROM users WHERE username = ${username} AND actif = true LIMIT 1`;

    if (users.length === 0) return res.status(401).json({ error: 'Identifiants invalides' });

    const user = users[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Identifiants invalides' });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    await sql`UPDATE users SET derniere_connexion = NOW() WHERE id = ${user.id}`;

    res.status(200).json({
      token,
      user: { id: user.id, username: user.username, nom: user.nom, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}
