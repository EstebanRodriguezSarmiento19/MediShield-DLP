import pool from '../db/pool.js';

export default async function errorHandler(error,req,res,next) {
  const parser=error.type==='entity.parse.failed'||error.type==='entity.too.large';
  const unavailable=['ECONNREFUSED','ETIMEDOUT','PROTOCOL_CONNECTION_LOST','ER_CON_COUNT_ERROR'].includes(error.code);
  const status=parser?(error.type==='entity.too.large'?413:400):unavailable?503:error.statusCode||500;
  if(status>=500) {
    console.error('[MediShield]',error.code||error.name);
    try {
      await pool.execute(
        `INSERT INTO error_log(method,path,status_code,error_code,error_name,ip,user_id)
         VALUES (?,?,?,?,?,?,?)`,
        [req.method,req.path,status,error.code||null,error.name||null,req.ip,req.user?.id||null]
      );
    } catch (logError) {
      console.error('[MediShield] error log failed',logError.code||logError.name);
    }
  }
  res.status(status).json({success:false,error:{message:parser?'JSON inválido o solicitud demasiado grande.':unavailable?'La base de datos no está disponible. No se guardó la operación.':error.isOperational?error.message:'Error interno del servidor'}});
}
