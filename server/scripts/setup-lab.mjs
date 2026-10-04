import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import {fileURLToPath} from 'node:url';
import {hashPassword} from '../src/features/auth/password.js';
const dir=fileURLToPath(new URL('../',import.meta.url));
const config=dotenv.parse(await fs.readFile(dir+'.env'));
const dbName=config.DB_NAME||'medishield';
if(!/^[A-Za-z0-9_]+$/.test(dbName)) throw new Error('Nombre de base de datos inválido.');
const cx=await mysql.createConnection({host:config.DB_HOST||'localhost',port:Number(config.DB_PORT||3306),user:config.DB_USER||'root',password:config.DB_PASSWORD||'',multipleStatements:false});
try {
 await cx.query('CREATE DATABASE IF NOT EXISTS '+mysql.escapeId(dbName)+' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
 await cx.changeUser({database:dbName});
 const schema=await fs.readFile(new URL('../../database/schema.sql',import.meta.url),'utf8');
 const migration=await fs.readFile(new URL('../../database/migrations/002_modules.sql',import.meta.url),'utf8');
 for(const source of [schema,migration]) {
  for(const statement of source.replace(/^--.*$/gm,'').split(';').map(s=>s.trim()).filter(Boolean)) {
   if(/^(CREATE DATABASE|USE )/i.test(statement)) continue;
   await cx.query(statement);
  }
 }
 for(const [id,weight] of [['DLP-001',35],['DLP-002',50],['DLP-003',25]]) await cx.execute('INSERT IGNORE INTO regla_dlp (id,peso) VALUES (?,?)',[id,weight]);
 for(const [address,name,allowed] of [['laboratorio@hospital.local','Laboratorio interno',true],['especialista@hospital.local','Especialista interno',true],['auditoria@partner.test','Socio de laboratorio',true],['bloqueado@externo.test','Destino revocado',false]]) {
  await cx.execute('INSERT IGNORE INTO destinatario (correo,nombre,autorizado) VALUES (?,?,?)',[address,name,allowed]);
 }
 const credentialsPath=dir+'.lab-accounts.json';
 let accounts;
 try {accounts=JSON.parse(await fs.readFile(credentialsPath,'utf8'));}
 catch(error) {
  if(error.code!=='ENOENT') throw error;
  accounts=[];
  for(const [role,address,name] of [['admin','admin.lab@medishield.local','Administrador de seguridad'],['usuario','medico.lab@medishield.local','Profesional de salud'],['usuario','medico2.lab@medishield.local','Segundo profesional'],['analista','analista.lab@medishield.local','Analista de seguridad']]) {
   const [[existing]]=await cx.execute('SELECT id_usuario FROM usuario WHERE correo=?',[address]);
   if(existing) throw new Error('La cuenta '+address+' ya existe; no se sobrescribió su contraseña.');
   const password=crypto.randomBytes(18).toString('base64url');
   await cx.execute('INSERT INTO usuario(nombre,correo,clave_hash,rol) VALUES (?,?,?,?)',[name,address,await hashPassword(password),role]);
   accounts.push({role,email:address,password});
  }
  await fs.writeFile(credentialsPath,JSON.stringify(accounts,null,2),{flag:'wx',mode:0o600});
 }
 const labPath=dir+'.env.lab';
 try {await fs.access(labPath);}
 catch(error) {
  if(error.code!=='ENOENT') throw error;
  const user='mdl_'+crypto.randomBytes(5).toString('hex'),password=crypto.randomBytes(24).toString('hex');
  await cx.query('CREATE USER ?@? IDENTIFIED BY ?',[user,'localhost',password]);
  const tables={usuario:'SELECT',sesion_web:'SELECT, INSERT, UPDATE, DELETE',auth_attempt:'SELECT, INSERT, UPDATE',
    destinatario:'SELECT, INSERT, UPDATE',regla_dlp:'SELECT, UPDATE',transferencia:'SELECT, INSERT, UPDATE',
    alerta:'SELECT, INSERT, UPDATE',historial_comunicacion:'SELECT, INSERT, UPDATE',audit_head:'SELECT, UPDATE',audit_event:'SELECT, INSERT'};
  for(const [table,privileges] of Object.entries(tables)) await cx.query('GRANT '+privileges+' ON '+mysql.escapeId(dbName)+'.'+mysql.escapeId(table)+' TO ?@?',[user,'localhost']);
  const values={DB_HOST:config.DB_HOST||'localhost',DB_PORT:config.DB_PORT||'3306',DB_NAME:dbName,DB_USER:user,DB_PASSWORD:password,
    AUDIT_HMAC_KEY:crypto.randomBytes(32).toString('hex'),HOST:'127.0.0.1',CLIENT_ORIGIN:config.CLIENT_ORIGIN||'http://localhost:5173',SMTP_ENABLED:'true',SMTP_PORT:'1025'};
  await fs.writeFile(labPath,Object.entries(values).map(([k,v])=>k+'='+v).join('\n')+'\n',{flag:'wx',mode:0o600});
 }
 console.log('Migración completa. Usuarios: '+accounts.map(a=>a.email+' ('+a.role+')').join(', '));
 console.log('Contraseñas en server/.lab-accounts.json (archivo local excluido de Git).');
 console.log('Cuenta SQL de aplicación sin UPDATE ni DELETE sobre audit_event. Configuración en server/.env.lab.');
} finally {await cx.end();}
