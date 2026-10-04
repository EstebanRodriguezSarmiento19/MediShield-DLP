import {Router} from 'express';
import pool,{transaction} from '../../db/pool.js';
import {roles} from '../auth/auth.js';
import {appendAudit,listAudit,verifyAudit} from '../audit/audit.service.js';
import {loadContext,decodeResult} from '../dlp/dlp.store.js';
import definitions from '../dlp/dlp.rules.js';
import {object,email,text,version,pageLimit,fail} from '../../shared/validation.js';
import asyncHandler from '../../shared/utils/asyncHandler.js';
const router=Router();
const ok=(res,data)=>res.json({success:true,data});
router.get('/recipients',asyncHandler(async(req,res)=>{
  const [rows]=await pool.execute('SELECT * FROM destinatario ORDER BY correo');
  const result=[];
  for(const row of rows) result.push({...row,...(await loadContext(pool,req.user.id,row.correo)).recipient});
  ok(res,result);
}));
router.post('/recipients',roles('admin'),asyncHandler(async(req,res)=>{
  object(req.body,['email','name','authorized']);
  const address=email(req.body.email),name=text(req.body.name,'Nombre',120);
  if(typeof req.body.authorized!=='boolean') fail('Autorización inválida.');
  await transaction(async cx=>{
    const [[exists]]=await cx.execute('SELECT correo FROM destinatario WHERE correo=?',[address]);
    if(exists) fail('El destinatario ya existe.',409);
    await cx.execute('INSERT INTO destinatario(correo,nombre,autorizado) VALUES (?,?,?)',[address,name,req.body.authorized]);
    await appendAudit(cx,{actor:req.user.id,action:'RECIPIENT_CREATED',resource:address,ip:req.ip,details:{authorized:req.body.authorized}});
  });
  res.status(201).json({success:true});
}));
router.patch('/recipients/:email',roles('admin'),asyncHandler(async(req,res)=>{
  object(req.body,['authorized','version']);
  const address=email(req.params.email),v=version(req.body.version);
  if(typeof req.body.authorized!=='boolean') fail('Autorización inválida.');
  await transaction(async cx=>{
    const [r]=await cx.execute('UPDATE destinatario SET autorizado=?,version=version+1 WHERE correo=? AND version=?',[req.body.authorized,address,v]);
    if(!r.affectedRows) fail('El destinatario cambió o no existe. Actualiza la lista.',409);
    await appendAudit(cx,{actor:req.user.id,action:'RECIPIENT_UPDATED',resource:address,ip:req.ip,details:{authorized:req.body.authorized,version:v+1}});
  });
  ok(res,{});
}));
router.get('/rules',roles('admin','analista'),asyncHandler(async(req,res)=>{
  const [rows]=await pool.execute('SELECT * FROM regla_dlp ORDER BY id');
  ok(res,rows.map(row=>({...definitions.find(d=>d.id===row.id),pattern:undefined,...row})));
}));
router.patch('/rules/:id',roles('admin'),asyncHandler(async(req,res)=>{
  object(req.body,['weight','version']);
  const v=version(req.body.version),weight=req.body.weight;
  if(!Number.isInteger(weight)||weight<25||weight>60) fail('Peso permitido: entero entre 25 y 60.');
  await transaction(async cx=>{
    const [r]=await cx.execute('UPDATE regla_dlp SET peso=?,version=version+1 WHERE id=? AND version=?',[weight,req.params.id,v]);
    if(!r.affectedRows) fail('La regla cambió o no existe.',409);
    await appendAudit(cx,{actor:req.user.id,action:'RULE_UPDATED',resource:req.params.id,ip:req.ip,details:{weight,version:v+1}});
  });
  ok(res,{});
}));
router.get('/alerts',roles('admin','analista'),asyncHandler(async(req,res)=>{
  const limit=pageLimit(req.query.limit);
  const [rows]=await pool.query('SELECT a.*,t.resultado,t.estado transfer_status,t.id_usuario FROM alerta a JOIN transferencia t ON t.id=a.transferencia_id ORDER BY a.actualizado DESC LIMIT ?',[limit]);
  ok(res,rows.map(row=>({...decodeResult({...row,estado:row.transfer_status}),alertId:row.id,alertStatus:row.estado,note:row.nota,version:row.version,reviewer:row.revisado_por})));
}));
router.patch('/alerts/:id',roles('admin','analista'),asyncHandler(async(req,res)=>{
  object(req.body,['status','note','version']);
  const state=req.body.status,note=text(req.body.note,'Nota de seguimiento',500),v=version(req.body.version);
  if(!['EN_REVISION','CERRADA'].includes(state)) fail('Estado inválido.');
  await transaction(async cx=>{
    const [[row]]=await cx.execute('SELECT * FROM alerta WHERE id=?',[req.params.id]);
    if(!row) fail('Alerta no encontrada.',404);
    if(row.version!==v || (row.estado==='ABIERTA' && state!=='EN_REVISION') || row.estado==='CERRADA' || row.estado===state) fail('Transición inválida. Actualiza la alerta.',409);
    await cx.execute('UPDATE alerta SET estado=?,nota=?,revisado_por=?,version=version+1,actualizado=UTC_TIMESTAMP(3) WHERE id=?',[state,note,req.user.id,row.id]);
    await appendAudit(cx,{actor:req.user.id,action:'ALERT_REVIEWED',resource:row.id,ip:req.ip,details:{from:row.estado,to:state}});
  });
  ok(res,{});
}));
router.get('/audit',roles('admin','analista'),asyncHandler(async(req,res)=>ok(res,await listAudit(pageLimit(req.query.limit)))));
router.get('/audit/verify',roles('admin','analista'),asyncHandler(async(req,res)=>ok(res,await verifyAudit())));
export default router;
