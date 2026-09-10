// api/registrar.js — Registro público de asistencia al campo
const { neon } = require('@neondatabase/serverless');
 
function ahoraMadrid() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
}
 
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
 
  // Restricción horaria server-side (06:00–23:59 hora Madrid)
  const hora = ahoraMadrid().getHours();
  if (hora < 6) {
    return res.status(400).json({
      error: 'horario_no_permitido: El campo solo acepta registros entre las 06:00 y las 23:59 (hora Madrid).'
    });
  }
 
  const { nombre_apellidos, fecha, hora_llegada, hora_salida, incidencia, detalle_incidencia } = req.body || {};
 
  // Validaciones
  if (!nombre_apellidos?.trim()) return res.status(400).json({ error: 'El nombre es obligatorio.' });
  if (!fecha)        return res.status(400).json({ error: 'La fecha es obligatoria.' });
  if (!hora_llegada) return res.status(400).json({ error: 'La hora de llegada es obligatoria.' });
  if (!hora_salida)  return res.status(400).json({ error: 'La hora de salida es obligatoria.' });
  if (hora_salida <= hora_llegada) return res.status(400).json({ error: 'La hora de salida debe ser posterior a la llegada.' });
  if (incidencia === undefined || incidencia === null) return res.status(400).json({ error: 'El campo de incidencia es obligatorio.' });
  if (incidencia && !detalle_incidencia?.trim()) return res.status(400).json({ error: 'El detalle de la incidencia es obligatorio.' });
 
  const sql = neon(process.env.DATABASE_URL);
 
  // Anti-flood: máximo 10 registros por nombre y día
  const [{ n }] = await sql`
    SELECT COUNT(*) as n FROM asistencias
    WHERE nombre_apellidos = ${nombre_apellidos.trim()} AND fecha = ${fecha}
  `;
  if (parseInt(n) >= 10) {
    return res.status(400).json({ error: 'limite_diario: Has alcanzado el límite de 10 registros por día.' });
  }
 
  await sql`
    INSERT INTO asistencias (nombre_apellidos, fecha, hora_llegada, hora_salida, incidencia, detalle_incidencia)
    VALUES (
      ${nombre_apellidos.trim()},
      ${fecha},
      ${hora_llegada},
      ${hora_salida},
      ${Boolean(incidencia)},
      ${incidencia && detalle_incidencia?.trim() ? detalle_incidencia.trim() : null}
    )
  `;
 
  res.status(200).json({ ok: true });
};
 
