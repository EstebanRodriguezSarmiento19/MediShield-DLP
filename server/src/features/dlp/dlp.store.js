import crypto from 'node:crypto';
import pool from '../../db/pool.js';
import definitions from './dlp.rules.js';
import { evaluateRecipient } from './dlp.service.js';
import { appendAudit } from '../audit/audit.service.js';
export async function loadContext(cx,userId,address) {
  const [[profile]]=await cx.execute('SELECT * FROM destinatario WHERE correo=?',[address]);
  const [[history]]=await cx.execute('SELECT envios_confirmados FROM historial_comunicacion WHERE id_usuario=? AND destinatario=?',[userId,address]);
  const [[total]]=await cx.execute('SELECT COALESCE(SUM(envios_confirmados),0) total FROM historial_comunicacion WHERE id_usuario=?',[userId]);
  const [configs]=await cx.execute('SELECT * FROM regla_dlp ORDER BY id');
  const rules=configs.filter(c=>c.activo).map(c=>({...definitions.find(r=>r.id===c.id),weight:c.peso,version:c.version}));
  if (!rules.length || rules.some(r=>!r.pattern)) throw new Error('No hay reglas válidas para analizar. Operación detenida.');
  return {recipient:evaluateRecipient(address,profile,Number(history?.envios_confirmados??0),Number(total.total)),rules};
}
export async function saveAnalysis(cx,result,user,ip) {
  await cx.execute('INSERT INTO transferencia (id,id_usuario,destinatario,decision,riesgo,content_hash,resultado,fecha_creacion) VALUES (?,?,?,?,?,?,?,?)',
    [result.id,user.id,result.recipient.email,result.decision,result.risk.score,result.content.contentHash,JSON.stringify(result),new Date(result.createdAt)]);
  if(result.decision!=='PERMITIR') await cx.execute('INSERT INTO alerta (id,transferencia_id,actualizado) VALUES (?,?,UTC_TIMESTAMP(3))',[crypto.randomUUID(),result.id]);
  await appendAudit(cx,{actor:user.id,action:'DLP_ANALYZED',resource:result.id,outcome:result.decision,ip,
    details:{contentHash:result.content.contentHash,score:result.risk.score,rules:result.content.matches.map(r=>r.ruleId)}});
}
export const decodeResult = row => ({...(typeof row.resultado==='string'?JSON.parse(row.resultado):row.resultado),status:row.estado,ownerId:row.id_usuario});
export async function getRecentAnalyses(user,limit) {
  const [rows]=await pool.query('SELECT * FROM transferencia WHERE (?=1 OR id_usuario=?) ORDER BY fecha_creacion DESC,id DESC LIMIT ?',[user.role!=='usuario'?1:0,user.id,limit]);
  return rows.map(decodeResult);
}
export async function getDlpStats(user) {
  const [[row]]=await pool.execute("SELECT COUNT(*) total,COALESCE(SUM(decision='PERMITIR'),0) allowed,COALESCE(SUM(decision='ALERTAR'),0) alerted,COALESCE(SUM(decision='BLOQUEAR'),0) blocked,COALESCE(SUM(estado='ENVIADA'),0) sent FROM transferencia WHERE (?=1 OR id_usuario=?)",[user.role!=='usuario'?1:0,user.id]);
  return Object.fromEntries(Object.entries(row).map(([k,v])=>[k,Number(v)]));
}
