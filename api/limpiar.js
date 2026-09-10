on api limpiar · JS
// api/limpiar.js — Limpieza de registros antiguos (llamado por GitHub Actions)
// Borra asistencias ordinarias >15 días e incidencias >60 días
const { neon } = require('@neondatabase/serverless');
 
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
 
  // Protegido por CLEANUP_KEY para que no lo pueda llamar cualquiera
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CLEANUP_KEY}`) {
    return res.status(403).json({ error: 'No autorizado.' });
  }
 
  const sql = neon(process.env.DATABASE_URL);
 
  const [r1] = await sql`
    WITH deleted AS (
      DELETE FROM asistencias
      WHERE incidencia = false AND fecha < current_date - interval '15 days'
      RETURNING id
    ) SELECT COUNT(*) as n FROM deleted
  `;
 
  const [r2] = await sql`
    WITH deleted AS (
      DELETE FROM asistencias
      WHERE incidencia = true AND fecha < current_date - interval '60 days'
      RETURNING id
    ) SELECT COUNT(*) as n FROM deleted
  `;
 
  res.json({
    ok: true,
    ordinarias_borradas:   parseInt(r1.n),
    incidencias_borradas:  parseInt(r2.n),
  });
};
