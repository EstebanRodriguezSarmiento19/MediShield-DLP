import test from 'node:test';
import assert from 'node:assert/strict';
import { forecastSeries, fitHolt } from '../src/features/datos/forecast.js';
import { buildResumen } from '../src/features/datos/datos.service.js';

test('pronóstico sigue una tendencia lineal exacta', () => {
  const values = Array.from({ length: 20 }, (_, i) => 2 * i + 1);
  const result = forecastSeries(values, 3);
  assert.equal(result.pronostico[0].valor, 41);
  assert.equal(result.pronostico[2].valor, 45);
  assert.equal(result.tendenciaDiaria, 2);
});

test('pronóstico de serie constante queda en el mismo nivel', () => {
  const result = forecastSeries(Array(14).fill(5), 2);
  assert.equal(result.pronostico[0].valor, 5);
  assert.equal(result.pronostico[1].valor, 5);
});

test('los valores pronosticados respetan los límites', () => {
  const result = forecastSeries([90, 92, 95, 99, 100, 100, 100, 100], 5, { floor: 0, ceil: 100 });
  for (const step of result.pronostico) {
    assert.ok(step.valor <= 100 && step.inferior >= 0 && step.superior <= 100);
  }
});

test('con menos de 4 observaciones no hay pronóstico', () => {
  assert.equal(forecastSeries([1, 2, 3], 3), null);
});

test('el intervalo de pronóstico se ensancha con el horizonte cuando hay ruido', () => {
  const values = [3, 7, 2, 8, 4, 9, 3, 8, 2, 7, 4, 9, 3, 8];
  const result = forecastSeries(values, 4);
  const widths = result.pronostico.map(p => p.superior - p.inferior);
  assert.ok(widths[3] >= widths[0]);
  assert.ok(fitHolt(values).alpha >= 0.1);
});

const row = (dia, decision, riesgo, destinatario = 'a@hospital.local', resultado = {}) => ({
  destinatario, decision, riesgo, estado: decision === 'PERMITIR' ? 'ENVIADA' : 'ANALIZADA',
  fecha_creacion: `${dia}T10:00:00Z`, resultado
});

test('resumen cuenta decisiones, bandas y rellena días sin datos con cero', () => {
  const now = new Date('2026-01-10T12:00:00Z');
  const rows = [
    row('2026-01-08', 'PERMITIR', 25),
    row('2026-01-08', 'BLOQUEAR', 100, 'x@gmail.com', { content: { matches: [{ ruleId: 'R1', name: 'Historia clínica', count: 2 }] } }),
    row('2026-01-10', 'ALERTAR', 50)
  ];
  const data = buildResumen(rows, { dias: 7, horizonte: 3, now });
  assert.equal(data.kpis.total, 3);
  assert.equal(data.kpis.permitidas, 1);
  assert.equal(data.kpis.bloqueadas, 1);
  assert.equal(data.serie.length, 7);
  assert.equal(data.serie.find(p => p.fecha === '2026-01-09').transferencias, 0);
  assert.equal(data.serie.find(p => p.fecha === '2026-01-09').riesgoPromedio, null);
  assert.equal(data.bandasRiesgo.find(b => b.etiqueta === '80 – 100').total, 1);
  assert.equal(data.destinatariosCriticos[0].destinatario, 'x@gmail.com');
  assert.equal(data.reglas[0].ocurrencias, 2);
  assert.equal(data.pronostico.transferencias.pronostico.length, 3);
  assert.ok(data.pronostico.transferencias.advertencias.some(a => a.includes('menos de 14')));
});

test('el pronóstico de la serie diaria incluye fechas futuras', () => {
  const now = new Date('2026-01-20T12:00:00Z');
  const rows = [];
  for (let d = 1; d <= 20; d++) rows.push(row(`2026-01-${String(d).padStart(2, '0')}`, 'PERMITIR', 25));
  const data = buildResumen(rows, { dias: 20, horizonte: 2, now });
  assert.equal(data.pronostico.transferencias.pronostico[0].fecha, '2026-01-21');
  assert.equal(data.pronostico.transferencias.pronostico[1].fecha, '2026-01-22');
});
