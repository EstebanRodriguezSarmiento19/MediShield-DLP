import crypto from 'node:crypto';
import dlpRules from './dlp.rules.js';
import { object, email, text, fail } from '../../shared/validation.js';
export function validateTransfer(payload) {
  object(payload,['recipient','subject','body']);
  const recipient=email(payload.recipient), subject=text(payload.subject??'','Asunto',200,false), body=text(payload.body??'','Mensaje',20000,false);
  if (!subject && !body) fail('Ingresa un asunto o mensaje.');
  return {recipient,subject,body};
}
export const contentHash = ({subject,body}) => crypto.createHash('sha256').update(subject+'\n'+body).digest('hex');
export function evaluateRecipient(address, profile, sentCount=0, totalSends=0) {
  const domain=address.split('@')[1];
  const external=!['hospital.local','clinica.local','medishield.local'].includes(domain);
  const habituality=totalSends>0?Math.round(sentCount/totalSends*100):0;
  const authorized=Boolean(profile?.autorizado);
  const reasons=[];
  if (!authorized) reasons.push('El destinatario no está autorizado en el catálogo.');
  if (external) reasons.push('El dominio es externo al laboratorio.');
  if (!sentCount) reasons.push('No hay envíos SMTP confirmados de este usuario a este destinatario.');
  return {email:address,domain,type:external?'EXTERNO':'INTERNO',authorized,hasHistory:sentCount>0,
    previousSends:sentCount,habituality,version:profile?.version??0,
    isAtypical:external || !sentCount || habituality<30,
    score:(external?25:0)+(!sentCount?25:habituality<30?15:0),reasons};
}
export function analyzeTransfer(payload, context={}) {
  const clean=validateTransfer(payload), started=performance.now();
  const source=(clean.subject+'\n'+clean.body).normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g,'').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const rules=context.rules??dlpRules.map(r=>({...r,version:1}));
  const matches=[];
  for (const rule of rules) {
    const found=Array.from(source.matchAll(rule.pattern));
    if (found.length) matches.push({ruleId:rule.id,name:rule.name,category:rule.category,sensitivity:rule.sensitivity,count:found.length,weight:rule.weight,version:rule.version});
  }
  const recipient=context.recipient??evaluateRecipient(clean.recipient,null);
  const score=Math.min(60,matches.reduce((sum,r)=>sum+r.weight,0));
  const risk=Math.min(100,score+recipient.score);
  const highExternal=recipient.type==='EXTERNO' && matches.some(m=>['ALTO','CRITICO'].includes(m.sensitivity));
  const decision=!recipient.authorized||highExternal||risk>=70?'BLOQUEAR':risk>=40?'ALERTAR':'PERMITIR';
  return {id:crypto.randomUUID(),createdAt:new Date().toISOString(),recipient,
    content:{score,matches,contentHash:contentHash(clean)},risk:{score:risk,level:decision==='BLOQUEAR'?'ALTO':decision==='ALERTAR'?'MEDIO':'BAJO'},
    decision,latencyMs:Math.max(1,Math.round(performance.now()-started)),policyVersion:'2.0',
    rulesVersion:rules.map(r=>r.id+':'+r.version),
    reasons:[matches.length?matches.length+' regla(s) detectada(s).':'No se detectaron patrones sensibles.',
      ...recipient.reasons,...(highExternal?['Los identificadores o historias clínicas no pueden enviarse a dominios externos.']:[]),
      decision==='PERMITIR'?'Autorizada para envío controlado.':decision==='ALERTAR'?'Retenida para revisión. No se envía correo.':'Transferencia bloqueada. No se envía correo.']};
}
export function getPublicRules() { return dlpRules.map(({pattern,...r})=>r); }
