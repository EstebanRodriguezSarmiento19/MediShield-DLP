import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import {hashPassword} from '../src/features/auth/password.js';
import {startSmtpLab} from './smtp-lab.mjs';
const serverRoot=fileURLToPath(new URL('../',import.meta.url)), project=path.dirname(serverRoot.slice(0,-1));
const output=path.join(project,'evidence','after'), mailbox=path.join(output,'smtp');
await fs.mkdir(output,{recursive:true});
const run=Date.now().toString(36), results=[], traces=[];
const adminConfig=dotenv.parse(await fs.readFile(path.join(serverRoot,'.env')));
const labConfig=dotenv.parse(await fs.readFile(path.join(serverRoot,'.env.lab')));
const admin=await mysql.createConnection({host:adminConfig.DB_HOST,port:Number(adminConfig.DB_PORT||3306),user:adminConfig.DB_USER,password:adminConfig.DB_PASSWORD||'',database:adminConfig.DB_NAME||'medishield'});
const restricted=await mysql.createConnection({host:labConfig.DB_HOST,port:Number(labConfig.DB_PORT),user:labConfig.DB_USER,password:labConfig.DB_PASSWORD,database:labConfig.DB_NAME});
const accounts={}; let server, smtp, port=3107;
const base='http://127.0.0.1:'+port+'/api';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function start(){
 server=spawn(process.execPath,['src/server.js'],{cwd:serverRoot,env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe'],windowsHide:true});
 let stderr=''; server.stderr.on('data',b=>{stderr+=b;});
 for(let i=0;i<60;i++){
  if(server.exitCode!==null)throw new Error('El backend no inició: '+stderr);
  try{if((await fetch(base+'/health')).ok)return;}catch{}
  await sleep(150);
 }
 throw new Error('Tiempo de espera del backend agotado. '+stderr);
}
async function stop(){
 if(server&&server.exitCode===null){server.kill();await new Promise(r=>server.once('exit',r));}
}
async function request(method,url,body,session,extra={}){
 const begin=performance.now();
 const headers={'Content-Type':'application/json',...(session?{Cookie:session.cookie,'X-CSRF-Token':session.csrf}:{}),...extra};
 const response=await fetch(base+url,{method,headers,...(body===undefined?{}:{body:JSON.stringify(body)})});
 const data=await response.json();
 traces.push({at:new Date().toISOString(),method,url,status:response.status,latencyMs:Math.round(performance.now()-begin),
  request:body?.password?{...body,password:'[REDACTED]'}:body,
  response:data?.data?.csrfToken?{...data,data:{user:data.data.user,csrfToken:'[REDACTED]'}}:data});
 return {status:response.status,data:data.data,error:data.error,headers:response.headers};
}
async function check(id,name,fn){try{const detail=await fn();results.push({id,name,status:'PASS',detail});console.log('PASS '+id+' '+name);}catch(e){results.push({id,name,status:'FAIL',detail:e.message});console.error('FAIL '+id+' '+e.message);}}
let user,other,security,analyst,good,warning,blocked;
const payload={recipient:'laboratorio@hospital.local',subject:'Validación '+run,body:'Agenda administrativa sintética.'};
try{
 for(const [key,role] of [['user','usuario'],['other','usuario'],['security','admin'],['analyst','analista']]){
  const email=key+'.'+run+'@medishield.local',password=crypto.randomBytes(18).toString('base64url');
  const [r]=await admin.execute('INSERT INTO usuario(nombre,correo,clave_hash,rol) VALUES (?,?,?,?)',['Prueba '+run,email,await hashPassword(password),role]);
  accounts[key]={email,password,id:r.insertId};
 }
 smtp=await startSmtpLab({directory:mailbox});
 await start();
 await check('AUT-01','Rechaza API sin sesión',async()=>{
  for(const route of ['/dlp/recent','/recipients','/alerts','/audit','/rules']) assert.equal((await request('GET',route)).status,401);
  assert.equal((await request('POST','/dlp/analyze',payload)).status,401);
 });
 await check('AUT-02','Credenciales incorrectas y SQL injection rechazadas',async()=>{
  assert.equal((await request('POST','/auth/login',{email:accounts.user.email,password:'incorrecta'})).status,401);
  assert.equal((await request('POST','/auth/login',{email:"' OR 1=1 --",password:'x'})).status,400);
 });
 async function login(key){
  const {email,password}=accounts[key],r=await request('POST','/auth/login',{email,password});
  assert.equal(r.status,200);
  return {cookie:r.headers.get('set-cookie').split(';')[0],csrf:r.data.csrfToken,user:r.data.user,headers:r.headers};
 }
 await check('AUT-03','Autenticación por roles y cookie HttpOnly SameSite',async()=>{
  user=await login('user');other=await login('other');security=await login('security');analyst=await login('analyst');
  assert.match(user.headers.get('set-cookie'),/HttpOnly/i);assert.match(user.headers.get('set-cookie'),/SameSite=Strict/i);
  assert.equal(user.user.role,'usuario');assert.equal(security.user.role,'admin');
 });
 await check('AUT-04','CSRF y origen externo bloqueados',async()=>{
  assert.equal((await request('POST','/dlp/analyze',payload,user,{'X-CSRF-Token':''})).status,403);
  assert.equal((await request('POST','/dlp/analyze',payload,user,{Origin:'http://attacker.test'})).status,403);
 });
 await check('AUT-05','RBAC: profesional sin auditoría ni reglas; analista sin envío',async()=>{
  for(const route of ['/audit','/alerts','/rules'])assert.equal((await request('GET',route,undefined,user)).status,403);
  assert.equal((await request('POST','/dlp/analyze',payload,analyst)).status,403);
  assert.equal((await request('POST','/recipients',{email:'x@y.test',name:'X',authorized:true},user)).status,403);
 });
 await check('DLP-01','Decisiones PERMITIR ALERTAR BLOQUEAR reales',async()=>{
  good=await request('POST','/dlp/analyze',payload,user);assert.equal(good.status,201);assert.equal(good.data.decision,'PERMITIR');
  warning=await request('POST','/dlp/analyze',{...payload,recipient:'auditoria@partner.test'},user);assert.equal(warning.data.decision,'ALERTAR');
  blocked=await request('POST','/dlp/analyze',{...payload,recipient:'bloqueado@externo.test',body:'HC-482910 CC 1012345678'},user);assert.equal(blocked.data.decision,'BLOQUEAR');
 });
 await check('DLP-02','No acepta decisión, remitente, autorización ni adjuntos sin inspección',async()=>{
  for(const field of ['decision','senderId','authorized','attachments'])assert.equal((await request('POST','/dlp/analyze',{...payload,[field]:'PERMITIR'},user)).status,400);
 });
 await check('DLP-03','Fuzz de tipos, correo y longitud',async()=>{
  for(const body of [{...payload,recipient:'x@'},[],{...payload,body:{}},{...payload,body:'X'.repeat(20001)}])assert.equal((await request('POST','/dlp/analyze',body,user)).status,400);
 });
 await check('DES-01','Destinatario desconocido bloqueado',async()=>{
  const r=await request('POST','/dlp/analyze',{...payload,recipient:'nuevo.'+run+'@hospital.local'},user);
  assert.equal(r.data.decision,'BLOQUEAR');assert.equal(r.data.recipient.authorized,false);
 });
 await check('DES-02','Catálogo solo editable por administrador con control de versión',async()=>{
  const address='autorizado.'+run+'@hospital.local';
  assert.equal((await request('POST','/recipients',{email:address,name:'Destino de prueba',authorized:false},security)).status,201);
  assert.equal((await request('PATCH','/recipients/'+address,{authorized:true,version:1},security)).status,200);
  assert.equal((await request('PATCH','/recipients/'+address,{authorized:false,version:1},security)).status,409);
  assert.equal((await request('POST','/dlp/analyze',{...payload,recipient:address},user)).data.decision,'PERMITIR');
 });
 await check('COR-01','SMTP no recibe alertas ni bloqueos',async()=>{
  const before=(await fs.readdir(mailbox)).filter(x=>x.endsWith('.eml')).length;
  for(const [r,p] of [[warning,{...payload,recipient:'auditoria@partner.test'}],[blocked,{...payload,recipient:'bloqueado@externo.test',body:'HC-482910 CC 1012345678'}]])
   assert.equal((await request('POST','/mail/send',{analysisId:r.data.id,...p},user)).status,409);
  assert.equal((await fs.readdir(mailbox)).filter(x=>x.endsWith('.eml')).length,before);
 });
 await check('COR-02','No reutiliza análisis para contenido cambiado ni para otro usuario',async()=>{
  assert.equal((await request('POST','/mail/send',{analysisId:good.data.id,...payload,body:'CC 1012345678'},user)).status,409);
  assert.equal((await request('POST','/mail/send',{analysisId:good.data.id,...payload},other)).status,404);
 });
 await check('COR-03','Correo permitido llega por SMTP y no se duplica',async()=>{
  const before=(await fs.readdir(mailbox)).filter(x=>x.endsWith('.eml')).length;
  const r=await request('POST','/mail/send',{analysisId:good.data.id,...payload},user);
  assert.equal(r.status,200);assert.equal(r.data.status,'ENVIADA');
  assert.equal((await fs.readdir(mailbox)).filter(x=>x.endsWith('.eml')).length,before+1);
  assert.equal((await request('POST','/mail/send',{analysisId:good.data.id,...payload},user)).status,409);
 });
 await check('COM-01','Historial solo crece por entrega SMTP y se separa por usuario',async()=>{
  const r=(await request('GET','/recipients',undefined,user)).data.find(x=>x.email===payload.recipient);
  const r2=(await request('GET','/recipients',undefined,other)).data.find(x=>x.email===payload.recipient);
  assert.equal(r.previousSends,1);assert.equal(r.habituality,100);assert.equal(r2.previousSends,0);
 });
 await check('DES-03','Revocación posterior al análisis impide envío',async()=>{
  const address='revocado.'+run+'@hospital.local',p={...payload,recipient:address};
  await request('POST','/recipients',{email:address,name:'Revocación de prueba',authorized:true},security);
  const analysis=await request('POST','/dlp/analyze',p,user);assert.equal(analysis.data.decision,'PERMITIR');
  await request('PATCH','/recipients/'+address,{authorized:false,version:1},security);
  assert.equal((await request('POST','/mail/send',{analysisId:analysis.data.id,...p},user)).status,409);
 });
 await check('REG-01','Cambio de regla protegido y auditado',async()=>{
  const rules=await request('GET','/rules',undefined,security),r=rules.data[0];
  assert.equal((await request('PATCH','/rules/'+r.id,{weight:r.peso,version:r.version},user)).status,403);
  assert.equal((await request('PATCH','/rules/'+r.id,{weight:r.peso,version:r.version},security)).status,200);
 });
 await check('ALE-01','Alerta persistente con seguimiento y transiciones válidas',async()=>{
  const r=(await request('GET','/alerts',undefined,security)).data.find(x=>x.id===blocked.data.id);
  assert.ok(r);assert.equal(r.alertStatus,'ABIERTA');
  assert.equal((await request('PATCH','/alerts/'+r.alertId,{status:'CERRADA',note:'No saltar revisión',version:r.version},security)).status,409);
  assert.equal((await request('PATCH','/alerts/'+r.alertId,{status:'EN_REVISION',note:'Revisado bloqueo de datos sintéticos',version:r.version},analyst)).status,200);
  assert.equal((await request('PATCH','/alerts/'+r.alertId,{status:'CERRADA',note:'Incidente de laboratorio atendido',version:r.version+1},analyst)).status,200);
  const [[row]]=await admin.execute('SELECT decision FROM transferencia WHERE id=?',[blocked.data.id]);assert.equal(row.decision,'BLOQUEAR');
 });
 await check('PER-01','Consultas separadas por dueño; SQL injection sin efecto',async()=>{
  assert.equal((await request('GET','/dlp/recent',undefined,other)).data.length,0);
  assert.equal((await request('GET','/dlp/recent?limit=1%20OR%201%3D1',undefined,user)).status,400);
  const [rows]=await admin.execute('SELECT resultado,content_hash FROM transferencia WHERE id=?',[blocked.data.id]);
  assert.equal(JSON.stringify(rows).includes('1012345678'),false);
  const [[row]]=await admin.execute('SELECT clave_hash FROM usuario WHERE id_usuario=?',[accounts.user.id]);assert.match(row.clave_hash,/^scrypt\$/);
 });
 await check('AUD-01','Auditoría registra actores y cadena HMAC válida',async()=>{
  const r=await request('GET','/audit/verify',undefined,security);assert.equal(r.data.valid,true);
  const events=(await request('GET','/audit?limit=100',undefined,security)).data;
  for(const action of ['LOGIN_SUCCESS','DLP_ANALYZED','ACCESS_DENIED','ALERT_REVIEWED','SEND_CONFIRMED'])assert.ok(events.some(e=>e.action===action),action);
 });
 await check('AUD-02','Cuenta SQL de aplicación no puede editar ni borrar auditoría',async()=>{
  for(const query of ["UPDATE audit_event SET payload='{}' WHERE sequence_no=0","DELETE FROM audit_event WHERE sequence_no=0"]) {
   await assert.rejects(()=>restricted.query(query),e=>e.code==='ER_TABLEACCESS_DENIED_ERROR');
  }
 });
 await check('PER-02','Datos y sesiones sobreviven al reinicio del proceso',async()=>{
  await stop();await start();
  assert.ok((await request('GET','/dlp/recent',undefined,user)).data.some(x=>x.id===good.data.id&&x.status==='ENVIADA'));
  assert.equal((await request('GET','/audit/verify',undefined,security)).data.valid,true);
 });
 await check('NF-01','Lote de 20 análisis, latencia observada y guardado completo',async()=>{
  const times=[];
  for(let i=0;i<20;i++){const start=performance.now();const r=await request('POST','/dlp/analyze',{...payload,subject:'Carga sintética '+run+' '+i},user);assert.equal(r.status,201);times.push(performance.now()-start);}
  times.sort((a,b)=>a-b);return {requests:20,p50Ms:Math.round(times[9]),p95Ms:Math.round(times[18]),maxMs:Math.round(times[19]),scope:'Secuencial, equipo local, no benchmark de producción'};
 });
 await check('AUT-06','Cierre de sesión invalida el token en el servidor',async()=>{
  assert.equal((await request('POST','/auth/logout',{},other)).status,200);
  assert.equal((await request('GET','/auth/me',undefined,other)).status,401);
 });
 await check('AUT-07','Sesión caducada rechazada',async()=>{
  await admin.execute('UPDATE sesion_web SET fecha_expiracion=DATE_SUB(UTC_TIMESTAMP(3),INTERVAL 1 SECOND) WHERE id_usuario=?',[accounts.analyst.id]);
  assert.equal((await request('GET','/auth/me',undefined,analyst)).status,401);
 });
 await check('AUT-08','Límite de intentos de contraseña persistente',async()=>{
  const credentials={email:'inexistente.'+run+'@medishield.local',password:'contraseña incorrecta'};
  for(let i=0;i<5;i++)assert.equal((await request('POST','/auth/login',credentials)).status,401);
  assert.equal((await request('POST','/auth/login',credentials)).status,429);
  await stop();await start();
  assert.equal((await request('POST','/auth/login',credentials)).status,429);
 });
 await check('NF-02','Cabeceras de seguridad y respuestas sin caché',async()=>{
  const r=await request('GET','/dlp/stats',undefined,user);
  assert.equal(r.headers.get('x-content-type-options'),'nosniff');
  assert.equal(r.headers.get('cache-control'),'no-store');
  assert.equal(r.headers.get('x-powered-by'),null);
 });
} finally {
 await stop(); if(smtp)await new Promise(r=>smtp.close(r));
 await restricted.end();await admin.end();
 const report={run,at:new Date().toISOString(),environment:{node:process.version,transport:'HTTP loopback + SMTP local',database:'MySQL real'},results,passed:results.filter(x=>x.status==='PASS').length,failed:results.filter(x=>x.status==='FAIL').length,traces};
 await fs.writeFile(path.join(output,'verification.json'),JSON.stringify(report,null,2));
 console.log('Evidencia: evidence/after/verification.json');
 if(report.failed)process.exitCode=1;
}
