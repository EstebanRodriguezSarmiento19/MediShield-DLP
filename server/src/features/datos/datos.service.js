import { forecastSeries } from './forecast.js';

// Bandas de riesgo idénticas a las del panel de control.
export const RISK_BANDS = [
  { etiqueta: '0 – 19', min: 0, max: 19 },
  { etiqueta: '20 – 39', min: 20, max: 39 },
  { etiqueta: '40 – 59', min: 40, max: 59 },
  { etiqueta: '60 – 79', min: 60, max: 79 },
  { etiqueta: '80 – 100', min: 80, max: 100 }
];
const DECISION_LABEL = { PERMITIR: 'Permitidas', ALERTAR: 'En alerta', BLOQUEAR: 'Bloqueadas' };

const dayKey = value => new Date(value).toISOString().slice(0, 10);
const pct = (part, total) => (total ? Math.round((part / total) * 1000) / 10 : 0);
const parseResult = value => (typeof value === 'string' ? JSON.parse(value) : value ?? {});

/**
 * Agrega las transferencias de la ventana de días pedida y calcula el pronóstico de la serie diaria.
 * `rows` son filas de la tabla `transferencia` (con `resultado` ya decodificado o como texto).
 */
export function buildResumen(rows, { dias = 60, horizonte = 7, now = new Date() } = {}) {
  const today = new Date(dayKey(now) + 'T00:00:00Z');
  const days = [];
  for (let i = dias - 1; i >= 0; i--) days.push(dayKey(today.getTime() - i * 86400000));
  const index = new Map(days.map((day, position) => [day, position]));

  const inWindow = rows.filter(row => index.has(dayKey(row.fecha_creacion)));
  const total = inWindow.length;
  const count = predicate => inWindow.filter(predicate).length;
  const allowed = count(r => r.decision === 'PERMITIR');
  const alerted = count(r => r.decision === 'ALERTAR');
  const blocked = count(r => r.decision === 'BLOQUEAR');
  const sent = count(r => r.estado === 'ENVIADA');

  const decisiones = ['PERMITIR', 'ALERTAR', 'BLOQUEAR'].map(decision => {
    const totalDecision = count(r => r.decision === decision);
    return { decision, etiqueta: DECISION_LABEL[decision], total: totalDecision, porcentaje: pct(totalDecision, total) };
  });

  const bandasRiesgo = RISK_BANDS.map(band => ({
    ...band,
    total: count(r => r.riesgo >= band.min && r.riesgo <= band.max)
  }));

  const byRecipient = new Map();
  for (const row of inWindow) {
    const entry = byRecipient.get(row.destinatario) ?? { destinatario: row.destinatario, riesgoMaximo: 0, transferencias: 0, bloqueadas: 0 };
    entry.riesgoMaximo = Math.max(entry.riesgoMaximo, Number(row.riesgo));
    entry.transferencias++;
    if (row.decision === 'BLOQUEAR') entry.bloqueadas++;
    byRecipient.set(row.destinatario, entry);
  }
  const destinatariosCriticos = [...byRecipient.values()]
    .sort((a, b) => b.riesgoMaximo - a.riesgoMaximo || b.transferencias - a.transferencias)
    .slice(0, 5);

  const byRule = new Map();
  for (const row of inWindow) {
    const matches = parseResult(row.resultado)?.content?.matches ?? [];
    for (const match of matches) {
      const entry = byRule.get(match.ruleId) ?? { id: match.ruleId, nombre: match.name, ocurrencias: 0 };
      entry.ocurrencias += match.count ?? 1;
      byRule.set(match.ruleId, entry);
    }
  }
  const reglas = [...byRule.values()].sort((a, b) => b.ocurrencias - a.ocurrencias);

  // Serie diaria completa: los días sin transferencias aparecen con cero.
  const serie = days.map(fecha => ({ fecha, transferencias: 0, bloqueadas: 0, sumaRiesgo: 0 }));
  for (const row of inWindow) {
    const point = serie[index.get(dayKey(row.fecha_creacion))];
    point.transferencias++;
    point.sumaRiesgo += Number(row.riesgo);
    if (row.decision === 'BLOQUEAR') point.bloqueadas++;
  }
  // riesgoPromedio es null en días sin datos; para pronosticar se rellena con el último valor conocido.
  const serieFinal = serie.map(({ sumaRiesgo, ...point }) => ({
    ...point,
    riesgoPromedio: point.transferencias ? Math.round((sumaRiesgo / point.transferencias) * 10) / 10 : null
  }));
  const riskSeries = fillForward(serieFinal.map(p => p.riesgoPromedio));
  const countSeries = serieFinal.map(p => p.transferencias);

  const pronostico = {
    horizonte,
    transferencias: forecastSeries(countSeries, horizonte, { floor: 0 }),
    riesgoPromedio: forecastSeries(riskSeries, horizonte, { floor: 0, ceil: 100 })
  };
  for (const key of ['transferencias', 'riesgoPromedio']) {
    if (pronostico[key]) {
      pronostico[key].pronostico = pronostico[key].pronostico.map((step, i) => ({
        fecha: dayKey(today.getTime() + (i + 1) * 86400000),
        ...step
      }));
    }
  }

  return {
    periodo: { dias, desde: days[0], hasta: days[days.length - 1] },
    kpis: {
      total, permitidas: allowed, alertas: alerted, bloqueadas: blocked, enviadas: sent,
      porcentajePermitidas: pct(allowed, total), porcentajeAlertas: pct(alerted, total), porcentajeBloqueadas: pct(blocked, total)
    },
    decisiones,
    bandasRiesgo,
    destinatariosCriticos,
    reglas,
    serie: serieFinal,
    pronostico
  };
}

function fillForward(values) {
  let last = values.find(v => v !== null);
  if (last === undefined) last = 0;
  return values.map(v => {
    if (v !== null) last = v;
    return last;
  });
}
