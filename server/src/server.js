import app from './app.js';
import env from './config/env.js';
import pool,{checkDatabaseConnection} from './db/pool.js';
if(env.auditKey.length<64) throw new Error('Configura AUDIT_HMAC_KEY ejecutando npm run db:setup.');
if(!await checkDatabaseConnection()) throw new Error('MySQL o las migraciones no están disponibles. Ejecuta npm run db:setup.');
const server=app.listen(env.port,env.host,()=>console.log('MediShield disponible en http://'+env.host+':'+env.port));
async function stop(){server.close(async()=>{await pool.end();});}
process.once('SIGINT',stop); process.once('SIGTERM',stop);
