import { Router } from 'express';
import crypto from 'node:crypto';
import pool, { transaction } from '../../db/pool.js';
import env from '../../config/env.js';
import { hashPassword, verifyPassword } from './password.js';
import { appendAudit, recordAudit } from '../audit/audit.service.js';
import { object, email, text, fail } from '../../shared/validation.js';
import asyncHandler from '../../shared/utils/asyncHandler.js';
import { recoveryConfigured, issueRecoveryToken, invalidateRecovery, sendRecoveryEmail } from './recovery.js';
export const hashToken = token => crypto.createHash('sha256').update(token).digest('hex');
export const cookieName = 'medishield_session';
const cookieOptions = { httpOnly:true, sameSite:'strict', secure:env.production, path:'/api' };
export const publicUser = u => ({ id:u.id_usuario, name:u.nombre, email:u.correo, role:u.rol,
  canManageUsers:u.rol==='admin' || Boolean(u.can_manage_users) });
export const requireAuth = asyncHandler(async(req,res,next) => {
  const token = req.headers.cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith(`${cookieName}=`))?.slice(cookieName.length+1);
  if (!token || !/^[0-9a-f]{64}$/.test(token)) fail('Debes iniciar sesión.',401);
  const [[session]] = await pool.execute(`SELECT s.*,u.nombre,u.correo,u.rol,
    EXISTS(SELECT 1 FROM gestor_usuarios g WHERE g.id_usuario=u.id_usuario) AS can_manage_users
    FROM sesion_web s JOIN usuario u ON u.id_usuario=s.id_usuario
    WHERE s.sesion_hash=? AND s.fecha_expiracion>UTC_TIMESTAMP(3) AND s.ultima_actividad>DATE_SUB(UTC_TIMESTAMP(3),INTERVAL 30 MINUTE) AND u.estado='activo'`,[hashToken(token)]);
  if (!session) fail('La sesión expiró o fue cerrada.',401);
  req.user = publicUser(session); req.session = session;
  await pool.execute('UPDATE sesion_web SET ultima_actividad=UTC_TIMESTAMP(3) WHERE sesion_hash=?',[session.sesion_hash]);
  next();
});
export const roles = (...allowed) => asyncHandler(async(req,res,next) => {
  if (!allowed.includes(req.user.role)) {
    await recordAudit({actor:req.user.id,action:'ACCESS_DENIED',resource:req.path,outcome:'DENIED',ip:req.ip});
    fail('Tu rol no tiene permiso para esta acción.',403);
  }
  next();
});
export function csrf(req,res,next) {
  if (['GET','HEAD','OPTIONS'].includes(req.method)) return next();
  const token = req.get('X-CSRF-Token') || '';
  if (!/^[0-9a-f]{64}$/.test(token) || !crypto.timingSafeEqual(Buffer.from(token),Buffer.from(req.session.csrf_token))) return next(Object.assign(new Error('Token CSRF inválido.'),{statusCode:403,isOperational:true}));
  next();
}
export function sameOrigin(req,res,next) {
  if (req.get('Origin') && req.get('Origin') !== env.clientOrigin) return next(Object.assign(new Error('Origen no permitido.'),{statusCode:403,isOperational:true}));
  next();
}
async function consumeLogin(address, ip) {
  return transaction(async cx => {
    for (const [identifier,max] of [[`email:${address}`,5],[`ip:${ip}`,40]]) {
      const bucket = hashToken(identifier);
      await cx.execute(`INSERT INTO auth_attempt(bucket,window_start,attempts) VALUES (?,UTC_TIMESTAMP(3),1)
        ON DUPLICATE KEY UPDATE attempts=IF(window_start < DATE_SUB(UTC_TIMESTAMP(3),INTERVAL 15 MINUTE),1,attempts+1),
        window_start=IF(window_start < DATE_SUB(UTC_TIMESTAMP(3),INTERVAL 15 MINUTE),UTC_TIMESTAMP(3),window_start)`,[bucket]);
      const [[row]]=await cx.execute('SELECT attempts FROM auth_attempt WHERE bucket=?',[bucket]);
      if (row.attempts>max) { await appendAudit(cx,{action:'LOGIN_THROTTLED',outcome:'DENIED',ip}); return false; }
    }
    return true;
  });
}
async function consumeRegister(ip) {
  return transaction(async cx => {
    const bucket = hashToken(`register:ip:${ip}`);
    await cx.execute(`INSERT INTO auth_attempt(bucket,window_start,attempts) VALUES (?,UTC_TIMESTAMP(3),1)
      ON DUPLICATE KEY UPDATE attempts=IF(window_start < DATE_SUB(UTC_TIMESTAMP(3),INTERVAL 15 MINUTE),1,attempts+1),
      window_start=IF(window_start < DATE_SUB(UTC_TIMESTAMP(3),INTERVAL 15 MINUTE),UTC_TIMESTAMP(3),window_start)`,[bucket]);
    const [[row]] = await cx.execute('SELECT attempts FROM auth_attempt WHERE bucket=?',[bucket]);
    if (row.attempts > 10) { await appendAudit(cx,{action:'REGISTER_THROTTLED',outcome:'DENIED',ip}); return false; }
    return true;
  });
}
async function openSession(cx, userId) {
  const token = crypto.randomBytes(32).toString('hex'), csrfToken = crypto.randomBytes(32).toString('hex');
  await cx.execute('DELETE FROM sesion_web WHERE fecha_expiracion<UTC_TIMESTAMP(3)');
  await cx.execute(`INSERT INTO sesion_web VALUES (?,?,?,UTC_TIMESTAMP(3),DATE_ADD(UTC_TIMESTAMP(3),INTERVAL 8 HOUR),UTC_TIMESTAMP(3))`,[hashToken(token),userId,csrfToken]);
  return { token, csrfToken };
}
const router=Router();
router.get('/config',(_req,res)=>res.json({success:true,data:{allowPublicRegistration:env.allowPublicRegistration,recoveryAvailable:recoveryConfigured()}}));
router.post('/login',sameOrigin,asyncHandler(async(req,res) => {
  object(req.body,['email','password']);
  const address=email(req.body.email), password=req.body.password;
  if (typeof password!=='string' || password.length<1 || password.length>128) fail('Credenciales inválidas.',401);
  if (!await consumeLogin(address,req.ip)) { res.set('Retry-After','900'); fail('Demasiados intentos. Espera 15 minutos.',429); }
  const [[user]]=await pool.execute(`SELECT u.*,
    EXISTS(SELECT 1 FROM gestor_usuarios g WHERE g.id_usuario=u.id_usuario) AS can_manage_users
    FROM usuario u WHERE u.correo=?`,[address]);
  const valid=await verifyPassword(password,user?.clave_hash);
  if (!valid || user.estado!=='activo') {
    await recordAudit({action:'LOGIN_FAILED',outcome:'DENIED',ip:req.ip,details:{accountHash:hashToken(address)}});
    fail('Credenciales inválidas.',401);
  }
  let session;
  await transaction(async cx=>{
    await cx.execute('UPDATE auth_attempt SET attempts=0 WHERE bucket=?',[hashToken('email:'+address)]);
    session=await openSession(cx,user.id_usuario);
    await appendAudit(cx,{actor:user.id_usuario,action:'LOGIN_SUCCESS',ip:req.ip});
  });
  res.cookie(cookieName,session.token,{...cookieOptions,maxAge:8*3600*1000});
  res.json({success:true,data:{user:publicUser(user),csrfToken:session.csrfToken}});
}));
router.post('/register',sameOrigin,asyncHandler(async(req,res) => {
  if(!env.allowPublicRegistration) fail('El registro público está desactivado. Solicita una invitación a un responsable del proyecto.',403);
  object(req.body,['name','email','password']);
  const name=text(req.body.name,'Nombre',150), address=email(req.body.email), password=req.body.password;
  if (name.length<2) fail('Nombre: debe tener al menos 2 caracteres.');
  if (address.length>150) fail('Correo inválido.');
  if (typeof password!=='string' || password.length<15 || password.length>128) fail('La contraseña debe tener entre 15 y 128 caracteres.');
  if (!await consumeRegister(req.ip)) { res.set('Retry-After','900'); fail('Demasiados intentos. Espera 15 minutos.',429); }
  const clave=await hashPassword(password);
  let user, session;
  try {
    await transaction(async cx=>{
      // El rol siempre es 'usuario': nunca se acepta del cliente.
      const [result]=await cx.execute("INSERT INTO usuario(nombre,correo,clave_hash,rol,estado) VALUES (?,?,?,'usuario','activo')",[name,address,clave]);
      user={id_usuario:result.insertId,nombre:name,correo:address,rol:'usuario'};
      session=await openSession(cx,user.id_usuario);
      await appendAudit(cx,{actor:user.id_usuario,action:'USER_REGISTERED',resource:'usuario',ip:req.ip});
    });
  } catch (err) {
    if (err?.code==='ER_DUP_ENTRY') {
      await recordAudit({action:'REGISTER_FAILED',outcome:'DENIED',ip:req.ip,details:{accountHash:hashToken(address)}});
      fail('No se pudo completar el registro. Si ya tienes cuenta, inicia sesión.',409);
    }
    throw err;
  }
  res.cookie(cookieName,session.token,{...cookieOptions,maxAge:8*3600*1000});
  res.status(201).json({success:true,data:{user:publicUser(user),csrfToken:session.csrfToken}});
}));
router.post('/password/forgot',sameOrigin,asyncHandler(async(req,res) => {
  object(req.body,['email']);
  const address=email(req.body.email);
  if (address.length>150) fail('Correo inválido.');
  if (!recoveryConfigured()) fail('La recuperación por correo aún no está disponible.',503);
  let recipient, token, blockedByIp=false;
  await transaction(async cx => {
    for (const [kind,value,max] of [['ip',req.ip,10],['email',address,3]]) {
      const bucket=hashToken(`password-forgot:${kind}:${value}`);
      await cx.execute(`INSERT INTO auth_attempt(bucket,window_start,attempts) VALUES (?,UTC_TIMESTAMP(3),1)
        ON DUPLICATE KEY UPDATE attempts=IF(window_start<DATE_SUB(UTC_TIMESTAMP(3),INTERVAL 15 MINUTE),1,attempts+1),
        window_start=IF(window_start<DATE_SUB(UTC_TIMESTAMP(3),INTERVAL 15 MINUTE),UTC_TIMESTAMP(3),window_start)`,[bucket]);
      const [[row]]=await cx.execute('SELECT attempts FROM auth_attempt WHERE bucket=?',[bucket]);
      if (row.attempts>max) { if(kind==='ip') blockedByIp=true; return; }
    }
    const [[user]]=await cx.execute("SELECT id_usuario,nombre,correo FROM usuario WHERE correo=? AND estado='activo'",[address]);
    if (!user) return;
    recipient=user;
    token=await issueRecoveryToken(cx,user.id_usuario);
    await appendAudit(cx,{actor:user.id_usuario,action:'PASSWORD_RESET_REQUESTED',resource:'usuario',ip:req.ip});
  });
  if (blockedByIp) { res.set('Retry-After','900'); fail('Demasiadas solicitudes. Espera 15 minutos.',429); }
  if (recipient) {
    void sendRecoveryEmail(recipient.correo,recipient.nombre,token).catch(async()=>{
      try { await transaction(async cx=>{await cx.execute('DELETE FROM recuperacion_clave WHERE token_hash=?',[hashToken(token)]);
        await appendAudit(cx,{actor:recipient.id_usuario,action:'PASSWORD_RESET_DELIVERY_FAILED',resource:'usuario',outcome:'FAILED',ip:req.ip});}); }
      catch { /* La respuesta genérica ya se entregó; no se exponen datos de la cuenta. */ }
    });
  }
  res.status(202).json({success:true,data:{message:'Si la cuenta existe y está activa, recibirás un enlace para restablecer la contraseña.'}});
}));
router.post('/password/reset',sameOrigin,asyncHandler(async(req,res) => {
  object(req.body,['token','password']);
  const token=req.body.token,password=req.body.password;
  if (typeof token!=='string' || !/^[0-9a-f]{64}$/.test(token)) fail('Enlace inválido o vencido.',400);
  if (typeof password!=='string' || password.length<15 || password.length>128) fail('La contraseña debe tener entre 15 y 128 caracteres.');
  const bucket=hashToken(`password-reset:ip:${req.ip}`);
  const allowed=await transaction(async cx=>{
    await cx.execute(`INSERT INTO auth_attempt(bucket,window_start,attempts) VALUES (?,UTC_TIMESTAMP(3),1)
      ON DUPLICATE KEY UPDATE attempts=IF(window_start<DATE_SUB(UTC_TIMESTAMP(3),INTERVAL 15 MINUTE),1,attempts+1),
      window_start=IF(window_start<DATE_SUB(UTC_TIMESTAMP(3),INTERVAL 15 MINUTE),UTC_TIMESTAMP(3),window_start)`,[bucket]);
    const [[row]]=await cx.execute('SELECT attempts FROM auth_attempt WHERE bucket=?',[bucket]);
    return row.attempts<=10;
  });
  if (!allowed) { res.set('Retry-After','900'); fail('Demasiados intentos. Espera 15 minutos.',429); }
  const encoded=await hashPassword(password);
  await transaction(async cx=>{
    const [[row]]=await cx.execute(`SELECT r.id_usuario FROM recuperacion_clave r
      JOIN usuario u ON u.id_usuario=r.id_usuario
      WHERE r.token_hash=? AND r.fecha_uso IS NULL AND r.fecha_expiracion>UTC_TIMESTAMP(3)
      AND u.estado='activo' FOR UPDATE`,[hashToken(token)]);
    if (!row) fail('Enlace inválido o vencido.',400);
    await cx.execute('UPDATE usuario SET clave_hash=? WHERE id_usuario=?',[encoded,row.id_usuario]);
    await cx.execute('UPDATE recuperacion_clave SET fecha_uso=UTC_TIMESTAMP(3) WHERE id_usuario=? AND fecha_uso IS NULL',[row.id_usuario]);
    await cx.execute('DELETE FROM sesion_web WHERE id_usuario=?',[row.id_usuario]);
    await appendAudit(cx,{actor:row.id_usuario,action:'PASSWORD_RESET_COMPLETED',resource:'usuario',ip:req.ip});
  });
  res.clearCookie(cookieName,cookieOptions).json({success:true,data:{message:'Contraseña actualizada. Inicia sesión de nuevo.'}});
}));
router.get('/me',requireAuth,(req,res)=>res.json({success:true,data:{user:req.user,csrfToken:req.session.csrf_token}}));
router.post('/logout',sameOrigin,requireAuth,csrf,asyncHandler(async(req,res)=>{
  await transaction(async cx=>{await cx.execute('DELETE FROM sesion_web WHERE sesion_hash=?',[req.session.sesion_hash]); await appendAudit(cx,{actor:req.user.id,action:'LOGOUT',ip:req.ip});});
  res.clearCookie(cookieName,cookieOptions).json({success:true});
}));
export default router;
