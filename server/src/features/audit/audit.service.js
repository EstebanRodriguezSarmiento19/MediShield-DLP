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
export function verifyTail(head, tail, key = env.auditKey) {
  if (Number(head.sequence_no) === 0) return !tail && head.event_hash === '0'.repeat(64);
  return Boolean(tail) && Number(tail.sequence_no) === Number(head.sequence_no) &&
    tail.event_hash === head.event_hash && eventHash(tail.previous_hash,tail.payload,key) === tail.event_hash;
}
export async function appendAudit(cx, { actor = null, action, resource = null, outcome = 'OK', ip = null, details = {} }) {
  const [[head]] = await cx.execute('SELECT sequence_no, event_hash FROM audit_head WHERE id=1 FOR UPDATE');
  const [[tail]] = await cx.execute('SELECT sequence_no,payload,previous_hash,event_hash FROM audit_event WHERE sequence_no=?',[head.sequence_no]);
  if (!verifyTail(head,tail)) throw new Error('La firma del último evento no coincide con AUDIT_HMAC_KEY. Se detuvo la escritura de auditoría.');
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
  let previous = '0'.repeat(64), seq = 0, brokenAt = null;
  const invalidHmacAt = [], brokenLinksAt = [];
  for (const row of rows) {
    seq += 1;
    const linkValid=Number(row.sequence_no)===seq && row.previous_hash===previous;
    const hmacValid=eventHash(row.previous_hash,row.payload,key)===row.event_hash;
    if(!linkValid){brokenLinksAt.push(seq);brokenAt??=seq;}
    if(!hmacValid){invalidHmacAt.push(seq);brokenAt??=seq;}
    previous = row.event_hash;
  }
  const headValid=Number(head.sequence_no)===seq && head.event_hash===previous;
  if(!headValid) brokenAt??=seq+1;
  return {valid:brokenAt===null,checked:seq,head:previous,headValid,
    ...(brokenAt===null?{}:{brokenAt,invalidHmacAt:invalidHmacAt.slice(0,20),brokenLinksAt:brokenLinksAt.slice(0,20),
      invalidHmacCount:invalidHmacAt.length,brokenLinkCount:brokenLinksAt.length})};
}
function describeEvent(row) {
  try {
    const payload = JSON.parse(row.payload);
    return { sequence: Number(row.sequence_no), at: payload.at ?? null, action: payload.action ?? null, actor: payload.actor ?? null };
  } catch {
    return { sequence: Number(row.sequence_no), at: null, action: null, actor: null };
  }
}
export async function verifyAudit() {
  return transaction(async cx => {
    const [rows] = await cx.execute('SELECT * FROM audit_event ORDER BY sequence_no');
    const [[head]] = await cx.execute('SELECT * FROM audit_head WHERE id=1');
    const report = verifyRows(rows,head);
    if (report.valid) return report;
    // Solo lectura: se muestran los eventos afectados para investigarlos; nunca se reescriben.
    const failed = new Set([...(report.invalidHmacAt??[]), ...(report.brokenLinksAt??[])]);
    const affectedEvents = rows.map((row,index)=>({row,seq:index+1})).filter(({seq})=>failed.has(seq)).map(({row})=>describeEvent(row));
    return { ...report, affectedEvents };
  });
}
