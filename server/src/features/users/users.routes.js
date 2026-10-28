import { Router } from 'express';
import crypto from 'node:crypto';
import env from '../../config/env.js';
import pool, { transaction } from '../../db/pool.js';
import { hashPassword } from '../auth/password.js';
import { recoveryConfigured, issueRecoveryToken, invalidateRecovery, sendRecoveryEmail } from '../auth/recovery.js';
import { appendAudit } from '../audit/audit.service.js';
import { object, email, text, fail } from '../../shared/validation.js';
import { validatePassword } from '../../shared/passwordPolicy.js';
import asyncHandler from '../../shared/utils/asyncHandler.js';

const router=Router();
const adminOnly=msg=>Object.assign(new Error(msg),{statusCode:403,isOperational:true});
const accountQuery=`SELECT u.id_usuario AS id,u.nombre AS name,u.correo AS email,u.rol AS role,
  u.estado AS status,u.fecha_creacion AS createdAt,
  (u.rol='admin' OR EXISTS(SELECT 1 FROM gestor_usuarios g WHERE g.id_usuario=u.id_usuario)) AS canManageUsers
  FROM usuario u`;
const emailHash=value=>crypto.createHmac('sha256',env.auditKey).update(value).digest('hex');
const randomPassword=()=>crypto.randomBytes(32).toString('base64url');
const accountId=req=>{
  const id=Number(req.params.id);
  if(!Number.isSafeInteger(id)||id<1) fail('Cuenta inválida.');
  return id;
};
function manager(req,res,next){
  if(!req.user.canManageUsers) return next(Object.assign(new Error('No tienes permiso para gestionar cuentas.'),{statusCode:403,isOperational:true}));
  next();
}
function role(value){
  if(!['admin','analista','usuario'].includes(value)) fail('Rol inválido.');
  return value;
}
function managerFlag(value){
  if(typeof value!=='boolean') fail('Permiso de gestión inválido.');
  return value;
}
async function setManager(cx,id,enabled,actor){
  if(enabled) await cx.execute('INSERT IGNORE INTO gestor_usuarios(id_usuario,concedido_por) VALUES (?,?)',[id,actor]);
  else await cx.execute('DELETE FROM gestor_usuarios WHERE id_usuario=?',[id]);
}
async function ensureNotLastAdmin(cx,target,newRole){
  if(target.role==='admin'&&newRole!=='admin'&&target.status==='activo'){
    const [[row]]=await cx.execute("SELECT COUNT(*) AS total FROM usuario WHERE rol='admin' AND estado='activo'");
    if(row.total<=1) fail('Debe permanecer al menos un administrador activo.',409);
  }
}
async function deliver(address,name,token,invitation){
  try {await sendRecoveryEmail(address,name,token,invitation);return true;}
  catch {return false;}
}

router.use(manager);
router.get('/',asyncHandler(async(_req,res)=>{
  const [rows]=await pool.execute(`${accountQuery} ORDER BY u.id_usuario`);
  res.json({success:true,data:rows.map(row=>({...row,canManageUsers:Boolean(row.canManageUsers)}))});
}));
router.post('/',asyncHandler(async(req,res)=>{
  object(req.body,['name','email','role','canManageUsers']);
  const name=text(req.body.name,'Nombre',150),address=email(req.body.email),assignedRole=role(req.body.role);
  const canManage=managerFlag(req.body.canManageUsers);
  if(name.length<2||address.length>150) fail('Nombre o correo inválido.');
  if(req.user.role!=='admin'&&(assignedRole!=='usuario'||canManage)) throw adminOnly('Solo un administrador puede asignar roles o permisos.');
  if(!recoveryConfigured()) fail('Configura el proveedor de correo antes de crear cuentas.',503);
  const encoded=await hashPassword(randomPassword());
  let id,token;
  try {
    await transaction(async cx=>{
      const [result]=await cx.execute("INSERT INTO usuario(nombre,correo,clave_hash,rol,estado) VALUES (?,?,?,?,'activo')",[name,address,encoded,assignedRole]);
      id=result.insertId;
      if(canManage&&assignedRole!=='admin') await setManager(cx,id,true,req.user.id);
      token=await issueRecoveryToken(cx,id);
      await appendAudit(cx,{actor:req.user.id,action:'USER_CREATED',resource:`usuario:${id}`,ip:req.ip,
        details:{emailHash:emailHash(address),role:assignedRole,canManage}});
    });
  } catch(err){if(err?.code==='ER_DUP_ENTRY') fail('Ya existe una cuenta con ese correo.',409);throw err;}
  const emailSent=await deliver(address,name,token,true);
  res.status(201).json({success:true,data:{id,emailSent,message:emailSent?'Invitación enviada.':'Cuenta creada. El envío falló; usa «Reenviar invitación».'}});
}));
router.patch('/:id',asyncHandler(async(req,res)=>{
  object(req.body,['name','email','role','canManageUsers']);
  if(!Object.keys(req.body).length) fail('No hay cambios.');
  const id=accountId(req);
  let destination,token,emailChanged=false;
  try {
    await transaction(async cx=>{
      const [[target]]=await cx.execute(`${accountQuery} WHERE u.id_usuario=? FOR UPDATE`,[id]);
      if(!target) fail('Cuenta no encontrada.',404);
      if(target.status!=='activo') fail('La cuenta está desactivada.',409);
      const name=req.body.name===undefined?target.name:text(req.body.name,'Nombre',150);
      const address=req.body.email===undefined?target.email:email(req.body.email);
      const assignedRole=req.body.role===undefined?target.role:role(req.body.role);
      const canManage=req.body.canManageUsers===undefined?Boolean(target.canManageUsers):managerFlag(req.body.canManageUsers);
      if(name.length<2||address.length>150) fail('Nombre o correo inválido.');
      emailChanged=address!==target.email;
      if(id===req.user.id&&(emailChanged||assignedRole!==target.role||canManage!==Boolean(target.canManageUsers)))
        fail('No puedes cambiar tu propio correo o permisos desde esta pantalla.',403);
      if(req.user.role!=='admin'&&(assignedRole!==target.role||canManage!==Boolean(target.canManageUsers))) throw adminOnly('Solo un administrador puede modificar roles o permisos.');
      if(emailChanged&&!recoveryConfigured()) fail('Configura el proveedor de correo antes de cambiar direcciones.',503);
      await ensureNotLastAdmin(cx,target,assignedRole);
      const permissionsChanged=assignedRole!==target.role||canManage!==Boolean(target.canManageUsers);
      if(emailChanged){
        const encoded=await hashPassword(randomPassword());
        await cx.execute('UPDATE usuario SET nombre=?,correo=?,rol=?,clave_hash=? WHERE id_usuario=?',[name,address,assignedRole,encoded,id]);
        token=await issueRecoveryToken(cx,id);
        destination={address,name};
      } else await cx.execute('UPDATE usuario SET nombre=?,rol=? WHERE id_usuario=?',[name,assignedRole,id]);
      await setManager(cx,id,canManage&&assignedRole!=='admin',req.user.id);
      if(permissionsChanged||emailChanged){
        await cx.execute('DELETE FROM sesion_web WHERE id_usuario=?',[id]);
        if(!emailChanged) await invalidateRecovery(cx,id);
      }
      await appendAudit(cx,{actor:req.user.id,action:'USER_UPDATED',resource:`usuario:${id}`,ip:req.ip,
        details:{oldEmailHash:emailHash(target.email),newEmailHash:emailHash(address),fromRole:target.role,toRole:assignedRole,
          canManage,emailChanged,sessionsRevoked:permissionsChanged||emailChanged}});
    });
  } catch(err){if(err?.code==='ER_DUP_ENTRY') fail('Ya existe una cuenta con ese correo.',409);throw err;}
  const emailSent=destination?await deliver(destination.address,destination.name,token,true):null;
  res.json({success:true,data:{emailSent,message:emailChanged?(emailSent?'Correo actualizado e invitación enviada.':'Correo actualizado. El envío falló; usa «Reenviar invitación».'):'Cuenta actualizada.'}});
}));
router.post('/:id/password',asyncHandler(async(req,res)=>{
  object(req.body,['newPassword']);
  const id=accountId(req);
  const newPassword=req.body.newPassword;
  validatePassword(newPassword);
  const encoded=await hashPassword(newPassword);
  await transaction(async cx=>{
    const [[target]]=await cx.execute(`${accountQuery} WHERE u.id_usuario=? FOR UPDATE`,[id]);
    if(!target) fail('Cuenta no encontrada.',404);
    if(target.status!=='activo') fail('La cuenta está desactivada.',409);
    await cx.execute('UPDATE usuario SET clave_hash=?,bloqueado_hasta=NULL WHERE id_usuario=?',[encoded,id]);
    await cx.execute('DELETE FROM sesion_web WHERE id_usuario=?',[id]);
    await invalidateRecovery(cx,id);
    await appendAudit(cx,{actor:req.user.id,action:'ADMIN_PASSWORD_CHANGED',resource:`usuario:${id}`,ip:req.ip});
  });
  res.json({success:true,data:{message:'Contraseña actualizada y sesiones cerradas.'}});
}));
router.delete('/:id',asyncHandler(async(req,res)=>{
  const id=accountId(req);
  if(id===req.user.id) fail('No puedes desactivar tu propia cuenta.',403);
  await transaction(async cx=>{
    const [[target]]=await cx.execute(`${accountQuery} WHERE u.id_usuario=? FOR UPDATE`,[id]);
    if(!target) fail('Cuenta no encontrada.',404);
    if(target.status==='inactivo') fail('La cuenta ya está desactivada.',409);
    await ensureNotLastAdmin(cx,target,'inactivo');
    await cx.execute("UPDATE usuario SET estado='inactivo' WHERE id_usuario=?",[id]);
    await cx.execute('DELETE FROM sesion_web WHERE id_usuario=?',[id]);
    await invalidateRecovery(cx,id);
    await setManager(cx,id,false,req.user.id);
    await appendAudit(cx,{actor:req.user.id,action:'USER_DEACTIVATED',resource:`usuario:${id}`,ip:req.ip,
      details:{emailHash:emailHash(target.email),role:target.role}});
  });
  res.json({success:true,data:{message:'Cuenta desactivada y sesiones cerradas.'}});
}));
router.post('/:id/reactivate',asyncHandler(async(req,res)=>{
  const id=accountId(req);
  if(!recoveryConfigured()) fail('Configura el proveedor de correo antes de reactivar cuentas.',503);
  const encoded=await hashPassword(randomPassword());
  let target,token;
  await transaction(async cx=>{
    [[target]]=await cx.execute(`${accountQuery} WHERE u.id_usuario=? FOR UPDATE`,[id]);
    if(!target) fail('Cuenta no encontrada.',404);
    if(target.status!=='inactivo') fail('La cuenta ya está activa.',409);
    await cx.execute("UPDATE usuario SET estado='activo',clave_hash=? WHERE id_usuario=?",[encoded,id]);
    token=await issueRecoveryToken(cx,id);
    await appendAudit(cx,{actor:req.user.id,action:'USER_REACTIVATED',resource:`usuario:${id}`,ip:req.ip});
  });
  const emailSent=await deliver(target.email,target.name,token,true);
  res.json({success:true,data:{emailSent,message:emailSent?'Cuenta reactivada e invitación enviada.':'Cuenta reactivada. Reenvía la invitación.'}});
}));
router.post('/:id/invite',asyncHandler(async(req,res)=>{
  const id=accountId(req);
  if(!recoveryConfigured()) fail('Configura el proveedor de correo antes de enviar invitaciones.',503);
  const encoded=await hashPassword(randomPassword());
  let target,token;
  await transaction(async cx=>{
    [[target]]=await cx.execute(`${accountQuery} WHERE u.id_usuario=? FOR UPDATE`,[id]);
    if(!target) fail('Cuenta no encontrada.',404);
    if(target.status!=='activo') fail('La cuenta está desactivada.',409);
    if(id===req.user.id) fail('No puedes restablecer tu propia cuenta desde esta pantalla.',403);
    await cx.execute('UPDATE usuario SET clave_hash=? WHERE id_usuario=?',[encoded,id]);
    await cx.execute('DELETE FROM sesion_web WHERE id_usuario=?',[id]);
    token=await issueRecoveryToken(cx,id);
    await appendAudit(cx,{actor:req.user.id,action:'USER_INVITED',resource:`usuario:${id}`,ip:req.ip});
  });
  const emailSent=await deliver(target.email,target.name,token,true);
  res.json({success:true,data:{emailSent,message:emailSent?'Invitación enviada.':'El envío falló. Puedes intentarlo de nuevo.'}});
}));
export default router;
