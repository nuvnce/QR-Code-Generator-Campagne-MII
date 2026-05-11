// api/_middleware/auth.js
import jwt from 'jsonwebtoken';

export function verifyToken(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export function requireRole(...roles) {
  return (req, res) => {
    const user = verifyToken(req);
    if (!user) return res.status(401).json({ error: 'Non authentifié' });
    if (!roles.includes(user.role)) return res.status(403).json({ error: 'Accès refusé' });
    return user;
  };
}
