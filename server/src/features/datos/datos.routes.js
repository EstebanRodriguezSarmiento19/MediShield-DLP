import { Router } from 'express';
import pool from '../../db/pool.js';
import { fail } from '../../shared/validation.js';
import asyncHandler from '../../shared/utils/asyncHandler.js';
import { buildResumen } from './datos.service.js';

// Datos agregados y pronóstico. Sin permiso adicional: cada cuenta ve sus propias transferencias,
// y quien tiene 'transferencias.ver_todas' ve las de toda la organización (misma regla que el panel).
const router = Router();
const intParam = (value, min, max, fallback, label) => {
  if (value === undefined) return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) fail(`${label} inválido (${min} a ${max}).`);
  return n;
};

router.get('/resumen', asyncHandler(async (req, res) => {
  const dias = intParam(req.query.dias, 7, 365, 60, 'Días');
  const horizonte = intParam(req.query.horizonte, 1, 30, 7, 'Horizonte');
  const all = req.user.permissions.includes('transferencias.ver_todas') ? 1 : 0;
  const [rows] = await pool.query(
    `SELECT destinatario,decision,riesgo,estado,fecha_creacion,resultado
     FROM transferencia WHERE (?=1 OR id_usuario=?) ORDER BY fecha_creacion ASC LIMIT 20000`,
    [all, req.user.id]
  );
  res.json({ success: true, data: buildResumen(rows, { dias, horizonte }) });
}));

export default router;
