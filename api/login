// api/login.js — Login de administradores
const { neon } = require('@neondatabase/serverless');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
 
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
 
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos.' });
 
  const sql = neon(process.env.DATABASE_URL);
  const admins = await sql`SELECT * FROM admins WHERE email = ${email.toLowerCase().trim()}`;
 
  if (!admins.length || !bcrypt.compareSync(password, admins[0].password_hash)) {
    // Mismo mensaje para no revelar si el email existe
    return res.status(401).json({ error: 'Credenciales incorrectas.' });
  }
 
  const token = jwt.sign(
    { email: admins[0].email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
 
  res.json({ token, email: admins[0].email });
};
 
