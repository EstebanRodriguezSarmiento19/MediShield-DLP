import crypto from 'node:crypto';
import pool, { transaction } from '../../db/pool.js';
import env from '../../config/env.js';
export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).sort(([a],[b]) => a < b ? -1 : a > b ? 1 : 0).map(([k,v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;
  return JSON.stringify(value);
}
export function eventHash(previous, payload, key = env.auditKey) {
  if (key.length < 64) throw new Error('AUDIT_HMAC_KEY debe contener al menos 64 caracteres.');
  return crypto.createHmac('sha256', key).update(`${previous}\n${payload}`).digest('hex');
}
export async function appendAudit(cx, { actor = null, action, resource = null, outcome = 'OK', ip = null, details = {} }) {
  const [[head]] = await cx.execute('SELECT sequence_no, event_hash FROM audit_head WHERE id=1 FOR UPDATE');
  const seq = Number(head.sequence_no) + 1;
  const payload = canonical({ sequence: seq, at: new Date().toISOString(), actor, action, resource, outcome, ip, details });
  const hash = eventHash(head.event_hash, payload);
  await cx.execute('INSERT INTO audit_event (sequence_no,payload,previous_hash,event_hash) VALUES (?,?,?,?)',[seq,payload,head.event_hash,hash]);
  await cx.execute('UPDATE audit_head SET sequence_no=?,event_hash=? WHERE id=1',[seq,hash]);
  return seq;
}
export const recordAudit = (event) => transaction(cx => appendAudit(cx, event));
export async function listAudit(limit) {
  const [rows] = await pool.query('SELECT sequence_no,payload,previous_hash,event_hash FROM audit_event ORDER BY sequence_no DESC LIMIT ?', [limit]);
  return rows.map(r => ({ ...JSON.parse(r.payload), previousHash:r.previous_hash, hash:r.event_hash }));
}
export function verifyRows(rows, head, key = env.auditKey) {
  let previous = '0'.repeat(64), seq = 0;
  for (const row of rows) {
    seq += 1;
    if (Number(row.sequence_no) !== seq || row.previous_hash !== previous || eventHash(previous,row.payload,key) !== row.event_hash) return { valid:false, checked:seq, brokenAt:seq };
    previous = row.event_hash;
  }
  return { valid: Number(head.sequence_no) === seq && head.event_hash === previous, checked:seq, head:previous };
}
export async function verifyAudit() {
  return transaction(async cx => {
    const [rows] = await cx.execute('SELECT * FROM audit_event ORDER BY sequence_no');
    const [[head]] = await cx.execute('SELECT * FROM audit_head WHERE id=1');
    return verifyRows(rows,head);
  });
}
