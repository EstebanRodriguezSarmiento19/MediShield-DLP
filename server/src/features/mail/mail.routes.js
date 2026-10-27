import {Router} from 'express';
import nodemailer from 'nodemailer';
import env from '../../config/env.js';
import pool,{transaction} from '../../db/pool.js';
import {roles} from '../auth/auth.js';
import {appendAudit} from '../audit/audit.service.js';
import {loadContext} from '../dlp/dlp.store.js';
import {analyzeTransfer,validateTransfer,contentHash} from '../dlp/dlp.service.js';
import {object,fail} from '../../shared/validation.js';
import asyncHandler from '../../shared/utils/asyncHandler.js';
const transport=nodemailer.createTransport({host:env.smtp.host,port:env.smtp.port,secure:false,ignoreTLS:true,
  connectionTimeout:3000,greetingTimeout:3000,socketTimeout:5000});
const router=Router();
router.post('/send',roles('usuario','admin'),asyncHandler(async(req,res)=>{
  object(req.body,['analysisId','recipient','subject','body']);
  const {analysisId,...payload}=req.body;
  if(typeof analysisId!=='string'||!/^[a-f0-9-]{36}$/.test(analysisId)) fail('ID de análisis inválido.');
  const clean=validateTransfer(payload);
  const admission=await transaction(async cx=>{
    const [[row]]=await cx.execute('SELECT * FROM transferencia WHERE id=? AND id_usuario=?',[analysisId,req.user.id]);
    if(!row) fail('Análisis no encontrado.',404);
    if(row.estado!=='ANALIZADA') fail('Este análisis ya fue procesado. Crea uno nuevo.',409);
    if(row.content_hash!==contentHash(clean)||row.destinatario!==clean.recipient) fail('El contenido o destino cambió. Analiza de nuevo.',409);
    const current=analyzeTransfer(clean,await loadContext(cx,req.user.id,clean.recipient));
    if(current.decision!=='PERMITIR'||row.decision!=='PERMITIR') {
      await appendAudit(cx,{actor:req.user.id,action:'SEND_DENIED',resource:analysisId,outcome:'DENIED',ip:req.ip,details:{decision:current.decision}});
      return {denied:true};
    }
    if(!env.smtp.enabled) fail('El correo de laboratorio está desactivado. Configura Mailpit antes de enviar.',503);
    await cx.execute("UPDATE transferencia SET estado='ENVIANDO' WHERE id=?",[analysisId]);
    await appendAudit(cx,{actor:req.user.id,action:'SEND_STARTED',resource:analysisId,ip:req.ip});
    return {denied:false};
  });
  if(admission.denied) fail('La política DLP retiene o bloquea este envío.',409);
  let sent;
  try {
    sent=await transport.sendMail({from:'MediShield <no-reply@medishield.local>',to:clean.recipient,subject:clean.subject,text:clean.body,
      messageId:'<'+analysisId+'@medishield.local>'});
    if(!sent.accepted.length) throw new Error('SMTP no aceptó al destinatario.');
  } catch {
    await transaction(async cx=>{
      await cx.execute("UPDATE transferencia SET estado='FALLIDA' WHERE id=?",[analysisId]);
      await appendAudit(cx,{actor:req.user.id,action:'SEND_FAILED',resource:analysisId,outcome:'ERROR',ip:req.ip});
    });
    fail('SMTP no confirmó el envío. Consulta auditoría; no se reintenta automáticamente.',502);
  }
  // An SMTP success followed by a DB failure remains ENVIANDO for reconciliation, never auto-retried.
  await transaction(async cx=>{
    await cx.execute("UPDATE transferencia SET estado='ENVIADA',message_id=? WHERE id=?",[sent.messageId,analysisId]);
    await cx.execute('INSERT INTO historial_comunicacion VALUES (?,?,1,UTC_TIMESTAMP(3)) ON DUPLICATE KEY UPDATE envios_confirmados=envios_confirmados+1,ultimo_envio=UTC_TIMESTAMP(3)',[req.user.id,clean.recipient]);
    await appendAudit(cx,{actor:req.user.id,action:'SEND_CONFIRMED',resource:analysisId,ip:req.ip,details:{messageId:sent.messageId}});
  });
  res.json({success:true,data:{id:analysisId,status:'ENVIADA',messageId:sent.messageId}});
}));
export default router;
