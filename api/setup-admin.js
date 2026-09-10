// api/setup-admin.js — Crea administradores (uso único, protegido por SETUP_KEY)
// Una vez creados los admins, puedes eliminar este archivo de GitHub por seguridad.
const { neon } = require('@neondatabase/serverless');
const bcrypt   = require('bcryptjs');
 
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
 
  const { email, password, setup_key } = req.body || {};
 
  // Verificar clave de configuración
  if (!process.env.SETUP_KEY || setup_key !== process.env.SETUP_KEY) {
    return res.status(403).json({ error: 'Clave de configuración incorrecta.' });
  }
 
  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos.' });
  if (password.length < 8)  return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
 
  const hash = bcrypt.hashSync(password, 10);
  const sql  = neon(process.env.DATABASE_URL);
 
  await sql`
    INSERT INTO admins (email, password_hash)
    VALUES (${email.toLowerCase().trim()}, ${hash})
    ON CONFLICT (email) DO UPDATE SET password_hash = ${hash}
  `;
 
  res.json({ ok: true, message: `Admin ${email} creado/actualizado correctamente.` });
};
 
