// api/cambiar-password.js — Cambio de contraseña para admins autenticados
const { neon } = require('@neondatabase/serverless');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
 
function verificarToken(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(auth.slice(7), process.env.JWT_SECRET);
  } catch {
    return null;
  }
}
 
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
 
  const user = verificarToken(req);
  if (!user) return res.status(401).json({ error: 'No autorizado.' });
 
  const { password_actual, password_nueva } = req.body || {};
 
  if (!password_actual || !password_nueva) {
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });
  }
  if (password_nueva.length < 8) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres.' });
  }
  if (password_actual === password_nueva) {
    return res.status(400).json({ error: 'La nueva contraseña debe ser diferente a la actual.' });
  }
 
  const sql = neon(process.env.DATABASE_URL);
 
  // Verificar contraseña actual usando pgcrypto (compatible con hashes creados por SQL)
  // Esto funciona independientemente de si el hash fue creado con pgcrypto o bcryptjs
  const verificado = await sql`
    SELECT id FROM admins
    WHERE email = ${user.email}
      AND password_hash = crypt(${password_actual}, password_hash)
  `;
 
  if (!verificado.length) {
    return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });
  }
 
  // Guardar nueva contraseña con bcryptjs (estándar a partir de ahora)
  const nuevo_hash = bcrypt.hashSync(password_nueva, 10);
  await sql`UPDATE admins SET password_hash = ${nuevo_hash} WHERE email = ${user.email}`;
 
  res.json({ ok: true, message: 'Contraseña actualizada correctamente.' });
};
 
