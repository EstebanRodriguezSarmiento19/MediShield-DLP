import { Router } from 'express';
import crypto from 'node:crypto';
import pool, { transaction } from '../../db/pool.js';
import env from '../../config/env.js';
import { verifyPassword } from './password.js';
import { appendAudit, recordAudit } from '../audit/audit.service.js';
import { object, email, fail } from '../../shared/validation.js';
import asyncHandler from '../../shared/utils/asyncHandler.js';
export const hashToken = token => crypto.createHash('sha256').update(token).digest('hex');
export const cookieName = 'medishield_session';
const cookieOptions = { httpOnly:true, sameSite:'strict', secure:env.production, path:'/api' };
export const publicUser = u => ({ id:u.id_usuario, name:u.nombre, email:u.correo, role:u.rol });
export const requireAuth = asyncHandler(async(req,res,next) => {
  const token = req.headers.cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith(`${cookieName}=`))?.slice(cookieName.length+1);
  if (!token || !/^[0-9a-f]{64}$/.test(token)) fail('Debes iniciar sesión.',401);
  const [[session]] = await pool.execute(`SELECT s.*,u.nombre,u.correo,u.rol FROM sesion_web s JOIN usuario u ON u.id_usuario=s.id_usuario
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
const router=Router();
router.post('/login',sameOrigin,asyncHandler(async(req,res) => {
  object(req.body,['email','password']);
  const address=email(req.body.email), password=req.body.password;
  if (typeof password!=='string' || password.length<1 || password.length>128) fail('Credenciales inválidas.',401);
  if (!await consumeLogin(address,req.ip)) { res.set('Retry-After','900'); fail('Demasiados intentos. Espera 15 minutos.',429); }
  const [[user]]=await pool.execute('SELECT * FROM usuario WHERE correo=?',[address]);
  const valid=await verifyPassword(password,user?.clave_hash);
  if (!valid || user.estado!=='activo') {
    await recordAudit({action:'LOGIN_FAILED',outcome:'DENIED',ip:req.ip,details:{accountHash:hashToken(address)}});
    fail('Credenciales inválidas.',401);
  }
  const token=crypto.randomBytes(32).toString('hex'), csrfToken=crypto.randomBytes(32).toString('hex');
  await transaction(async cx=>{
    await cx.execute('UPDATE auth_attempt SET attempts=0 WHERE bucket=?',[hashToken('email:'+address)]);
    await cx.execute('DELETE FROM sesion_web WHERE fecha_expiracion<UTC_TIMESTAMP(3)');
    await cx.execute(`INSERT INTO sesion_web VALUES (?,?,?,UTC_TIMESTAMP(3),DATE_ADD(UTC_TIMESTAMP(3),INTERVAL 8 HOUR),UTC_TIMESTAMP(3))`,[hashToken(token),user.id_usuario,csrfToken]);
    await appendAudit(cx,{actor:user.id_usuario,action:'LOGIN_SUCCESS',ip:req.ip});
  });
  res.cookie(cookieName,token,{...cookieOptions,maxAge:8*3600*1000});
  res.json({success:true,data:{user:publicUser(user),csrfToken}});
}));
router.get('/me',requireAuth,(req,res)=>res.json({success:true,data:{user:req.user,csrfToken:req.session.csrf_token}}));
router.post('/logout',sameOrigin,requireAuth,csrf,asyncHandler(async(req,res)=>{
  await transaction(async cx=>{await cx.execute('DELETE FROM sesion_web WHERE sesion_hash=?',[req.session.sesion_hash]); await appendAudit(cx,{actor:req.user.id,action:'LOGOUT',ip:req.ip});});
  res.clearCookie(cookieName,cookieOptions).json({success:true});
}));
export default router;
