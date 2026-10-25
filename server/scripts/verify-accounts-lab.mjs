import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

// Ruta fija relativa a este script; no se construye a partir de una solicitud.
// eslint-disable-next-line security/detect-non-literal-fs-filename
const labDb=dotenv.parse(await fs.readFile(new URL('../.env',import.meta.url),'utf8'));
const adminDb=await mysql.createConnection({host:labDb.DB_HOST||'localhost',port:Number(labDb.DB_PORT||3306),
  user:labDb.DB_USER||'root',password:labDb.DB_PASSWORD||'',database:labDb.DB_NAME||'medishield'});
try{
  for(const ip of ['127.0.0.1','::ffff:127.0.0.1','::1']){
    for(const prefix of ['password-reset:ip:','password-forgot:ip:']){
      const bucket=crypto.createHash('sha256').update(prefix+ip).digest('hex');
      await adminDb.execute('DELETE FROM auth_attempt WHERE bucket=?',[bucket]);
    }
  }
}finally{await adminDb.end();}

process.env.BREVO_API_KEY='lab-mock-key';
process.env.BREVO_SENDER_EMAIL='lab@medishield.local';
const nativeFetch=globalThis.fetch;
const sent=[];
globalThis.fetch=async(url,options)=>{
  if(String(url)==='https://api.brevo.com/v3/smtp/email'){
    const message=JSON.parse(options.body);
    sent.push(message);
    return new Response(JSON.stringify({messageId:'lab-mock'}),{status:201});
  }
  return nativeFetch(url,options);
};

const {default:app}=await import('../src/app.js');
const {default:pool}=await import('../src/db/pool.js');
// Ruta fija de credenciales locales excluidas de Git.
// eslint-disable-next-line security/detect-non-literal-fs-filename
const accounts=JSON.parse(await fs.readFile(new URL('../.lab-accounts.json',import.meta.url),'utf8'));
const admin=accounts.find(account=>account.role==='admin');
if(!admin) throw new Error('Falta la cuenta administradora de laboratorio.');
const server=app.listen(0,'127.0.0.1');
await new Promise(resolve=>server.once('listening',resolve));
const base=`http://127.0.0.1:${server.address().port}/api`;
async function call(path,{method='GET',body,session}={}){
  const response=await nativeFetch(base+path,{method,headers:{'Content-Type':'application/json',
    ...(session?{Cookie:session.cookie,'X-CSRF-Token':session.csrf}: {})},body:body===undefined?undefined:JSON.stringify(body)});
  return {status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]};
}
async function login(email,password){
  const response=await call('/auth/login',{method:'POST',body:{email,password}});
  assert.equal(response.status,200,response.data?.error?.message);
  return {cookie:response.cookie,csrf:response.data.data.csrfToken};
}
function lastToken(){
  const text=sent.at(-1)?.textContent||'';
  const link=text.match(/https?:\/\/[^\s]+\/reset-password#token=[0-9a-f]{64}/)?.[0];
  assert.ok(link,'La invitación debe contener un enlace de recuperación.');
  return new URLSearchParams(new URL(link).hash.slice(1)).get('token');
}
function lastRegistrationToken(){
  const content=sent.at(-1)?.textContent||'';
  const link=content.match(/https?:\/\/[^\s]+\/register\/confirm#token=[0-9a-f]{64}/)?.[0];
  assert.ok(link,'El registro debe enviar un enlace de confirmación.');
  return new URLSearchParams(new URL(link).hash.slice(1)).get('token');
}
const suffix=crypto.randomBytes(6).toString('hex');
const address=`qa-${suffix}@medishield.local`;
const newAddress=`qa-new-${suffix}@medishield.local`;
const password1=`Prueba-segura-${crypto.randomBytes(18).toString('hex')}`;
const password2=`Renovada-segura-${crypto.randomBytes(18).toString('hex')}`;
let checks=0;
try{
  const adminSession=await login(admin.email,admin.password);
  const beforeExistingRegistration=sent.length;
  let registration=await call('/auth/register',{method:'POST',body:{name:'Nombre nuevo',email:admin.email}});
  assert.equal(registration.status,202,registration.data?.error?.message);
  assert.equal(sent.length,beforeExistingRegistration);checks++;
  const registrationAddress=`qa-register-${suffix}@medishield.local`;
  registration=await call('/auth/register',{method:'POST',body:{name:'Registro verificado',email:registrationAddress}});
  assert.equal(registration.status,202,registration.data?.error?.message);checks++;
  const registrationToken=lastRegistrationToken();
  registration=await call('/auth/login',{method:'POST',body:{email:registrationAddress,password:password1}});
  assert.equal(registration.status,401);checks++;
  registration=await call('/auth/register/confirm',{method:'POST',body:{token:'0'.repeat(64),password:password1}});
  assert.equal(registration.status,400);checks++;
  registration=await call('/auth/register/confirm',{method:'POST',body:{token:registrationToken,password:password1}});
  assert.equal(registration.status,201,registration.data?.error?.message);checks++;
  registration=await call('/auth/register/confirm',{method:'POST',body:{token:registrationToken,password:password1}});
  assert.equal(registration.status,400);checks++;
  const registrationSession=await login(registrationAddress,password1);
  registration=await call('/auth/me',{session:registrationSession});
  assert.equal(registration.data.data.user.role,'usuario');checks++;
  registration=await call('/users',{session:registrationSession});
  assert.equal(registration.status,403);checks++;
  registration=await call('/users',{session:adminSession});
  const registered=registration.data.data.find(u=>u.email===registrationAddress);
  assert.ok(registered);
  registration=await call(`/users/${registered.id}`,{method:'DELETE',session:adminSession});
  assert.equal(registration.status,200);checks++;
  let response=await call('/auth/me',{session:adminSession});
  const adminId=response.data.data.user.id;
  response=await call(`/users/${adminId}`,{method:'DELETE',session:adminSession});
  assert.equal(response.status,403);checks++;
  response=await call(`/users/${adminId}`,{method:'PATCH',body:{role:'usuario'},session:adminSession});
  assert.equal(response.status,403);checks++;
  response=await call('/users');assert.equal(response.status,401);checks++;
  response=await call('/users',{session:adminSession});
  assert.equal(response.status,200);checks++;
  response=await call('/users',{method:'POST',body:{name:'Cuenta de prueba',email:address,role:'usuario',canManageUsers:false},session:adminSession});
  assert.equal(response.status,201,response.data?.error?.message);
  assert.equal(response.data.data.emailSent,true);checks++;
  const id=response.data.data.id;
  response=await call('/auth/password/reset',{method:'POST',body:{token:lastToken(),password:password1}});
  assert.equal(response.status,200,response.data?.error?.message);checks++;
  let userSession=await login(address,password1);checks++;
  response=await call('/users',{session:userSession});assert.equal(response.status,403);checks++;
  response=await call(`/users/${id}`,{method:'PATCH',body:{role:'analista',canManageUsers:true},session:adminSession});
  assert.equal(response.status,200,response.data?.error?.message);checks++;
  response=await call('/auth/me',{session:userSession});assert.equal(response.status,401);checks++;
  userSession=await login(address,password1);
  response=await call('/users',{session:userSession});assert.equal(response.status,200);checks++;
  response=await call('/users',{method:'POST',body:{name:'Subcuenta de prueba',email:`qa-child-${suffix}@medishield.local`,role:'usuario',canManageUsers:false},session:userSession});
  assert.equal(response.status,201,response.data?.error?.message);checks++;
  const childId=response.data.data.id;
  response=await call(`/users/${childId}`,{method:'DELETE',session:adminSession});assert.equal(response.status,200);checks++;
  response=await call(`/users/${id}`,{method:'PATCH',body:{email:newAddress},session:adminSession});
  assert.equal(response.status,200,response.data?.error?.message);
  assert.equal(response.data.data.emailSent,true);checks++;
  response=await call('/auth/me',{session:userSession});assert.equal(response.status,401);checks++;
  response=await call('/auth/login',{method:'POST',body:{email:newAddress,password:password1}});
  assert.equal(response.status,401);checks++;
  response=await call('/auth/password/reset',{method:'POST',body:{token:lastToken(),password:password1}});
  assert.equal(response.status,200,response.data?.error?.message);checks++;
  userSession=await login(newAddress,password1);checks++;
  response=await call('/auth/password/forgot',{method:'POST',body:{email:newAddress}});
  assert.equal(response.status,202,response.data?.error?.message);checks++;
  const resetToken=lastToken();
  response=await call('/auth/password/reset',{method:'POST',body:{token:resetToken,password:password2}});
  assert.equal(response.status,200,response.data?.error?.message);checks++;
  response=await call('/auth/password/reset',{method:'POST',body:{token:resetToken,password:password2}});
  assert.equal(response.status,400);checks++;
  response=await call('/auth/me',{session:userSession});assert.equal(response.status,401);checks++;
  response=await call('/auth/login',{method:'POST',body:{email:newAddress,password:password1}});
  assert.equal(response.status,401);checks++;
  userSession=await login(newAddress,password2);checks++;
  response=await call(`/users/${id}`,{method:'DELETE',session:adminSession});
  assert.equal(response.status,200,response.data?.error?.message);checks++;
  response=await call('/auth/me',{session:userSession});assert.equal(response.status,401);checks++;
  response=await call(`/users/${id}/reactivate`,{method:'POST',body:{},session:adminSession});
  assert.equal(response.status,200,response.data?.error?.message);checks++;
  response=await call('/auth/password/reset',{method:'POST',body:{token:lastToken(),password:password2}});
  assert.equal(response.status,200,response.data?.error?.message);checks++;
  await login(newAddress,password2);checks++;
  response=await call(`/users/${id}`,{method:'DELETE',session:adminSession});
  assert.equal(response.status,200);checks++;
  response=await call('/audit/verify',{session:adminSession});
  assert.equal(response.status,200,response.data?.error?.message);
  assert.equal(response.data.data.valid,true);checks++;
  console.log(`Gestión de cuentas y recuperación: ${checks} verificaciones aprobadas. Correo simulado; no se envió a Internet.`);
}finally{await new Promise(resolve=>server.close(resolve));await pool.end();globalThis.fetch=nativeFetch;}
