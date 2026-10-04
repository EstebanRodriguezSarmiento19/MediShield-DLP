export default function errorHandler(error,req,res,next) {
  const parser=error.type==='entity.parse.failed'||error.type==='entity.too.large';
  const unavailable=['ECONNREFUSED','ETIMEDOUT','PROTOCOL_CONNECTION_LOST','ER_CON_COUNT_ERROR'].includes(error.code);
  const status=parser?(error.type==='entity.too.large'?413:400):unavailable?503:error.statusCode||500;
  if(status>=500) console.error('[MediShield]',error.code||error.name);
  res.status(status).json({success:false,error:{message:parser?'JSON inválido o solicitud demasiado grande.':unavailable?'La base de datos no está disponible. No se guardó la operación.':error.isOperational?error.message:'Error interno del servidor'}});
}
