// api/asistencias.js — Consulta de registros (solo admins)
const { neon } = require('@neondatabase/serverless');
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();
 
  const user = verificarToken(req);
  if (!user) return res.status(401).json({ error: 'No autorizado. Inicia sesión como administrador.' });
 
  const { desde, hasta, solo_incidencias } = req.query;
  if (!desde || !hasta) return res.status(400).json({ error: 'Parámetros desde y hasta requeridos.' });
 
  const sql = neon(process.env.DATABASE_URL);
 
  let registros;
  if (solo_incidencias === 'true') {
    registros = await sql`
      SELECT id, nombre_apellidos, fecha::text,
             hora_llegada::text, hora_salida::text,
             incidencia, detalle_incidencia, creado_en
      FROM asistencias
      WHERE fecha BETWEEN ${desde} AND ${hasta}
        AND incidencia = true
      ORDER BY fecha, hora_llegada
    `;
  } else {
    registros = await sql`
      SELECT id, nombre_apellidos, fecha::text,
             hora_llegada::text, hora_salida::text,
             incidencia, detalle_incidencia, creado_en
      FROM asistencias
      WHERE fecha BETWEEN ${desde} AND ${hasta}
      ORDER BY fecha, hora_llegada
    `;
  }
 
  res.json(registros);
};
 
