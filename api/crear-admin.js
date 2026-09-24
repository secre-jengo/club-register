// api/crear-admin.js — Alta de nuevo administrador (solo admins autenticados)
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

  // Solo admins autenticados pueden crear nuevos admins
  const user = verificarToken(req);
  if (!user) return res.status(401).json({ error: 'No autorizado. Debes iniciar sesión como administrador.' });

  const { email, password } = req.body || {};

  // Validaciones
  if (!email?.trim())    return res.status(400).json({ error: 'El email es obligatorio.' });
  if (!password)         return res.status(400).json({ error: 'La contraseña es obligatoria.' });
  if (password.length < 8) return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ error: 'El formato del email no es válido.' });
  }

  const sql = neon(process.env.DATABASE_URL);

  // Comprobar si el email ya existe
  const existente = await sql`SELECT id FROM admins WHERE email = ${email.toLowerCase().trim()}`;
  if (existente.length) {
    return res.status(409).json({ error: 'Ya existe un administrador con ese email.' });
  }

  // Hashear contraseña y crear admin
  const hash = bcrypt.hashSync(password, 10);
  await sql`
    INSERT INTO admins (email, password_hash)
    VALUES (${email.toLowerCase().trim()}, ${hash})
  `;

  res.status(201).json({ ok: true, message: `Administrador ${email.trim()} creado correctamente.` });
};
