import express from 'express';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import helmet from 'helmet';
import {rateLimit} from 'express-rate-limit';
import env from './config/env.js';
import errorHandler from './middleware/errorHandler.js';
import notFound from './middleware/notFound.js';
import healthRoutes from './features/health/health.routes.js';
import dlpRoutes from './features/dlp/dlp.routes.js';
import authRoutes,{requireAuth,csrf,sameOrigin} from './features/auth/auth.js';
import securityRoutes from './features/security/security.routes.js';
import mailRoutes from './features/mail/mail.routes.js';
import usersRoutes from './features/users/users.routes.js';
import rolesRoutes from './features/roles/roles.routes.js';
import profileRoutes from './features/profile/profile.routes.js';
const app=express();
if (env.production) app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet({strictTransportSecurity:env.production?undefined:false,referrerPolicy:{policy:'no-referrer'}}));
app.use(cors({origin:env.clientOrigin,credentials:true}));
app.use((req,res,next)=>{res.set('Cache-Control','no-store'); next();});
app.use('/api',rateLimit({windowMs:60000,limit:180,standardHeaders:'draft-7',legacyHeaders:false,
  message:{success:false,error:{message:'Demasiadas solicitudes. Espera un minuto.'}}}));
app.use(express.json({limit:'64kb'}));
app.use('/api/health',healthRoutes);
app.use('/api/auth',authRoutes);
app.use('/api',sameOrigin,requireAuth,csrf);
app.use('/api/dlp',dlpRoutes);
app.use('/api/mail',mailRoutes);
app.use('/api/users',usersRoutes);
app.use('/api/roles',rolesRoutes);
app.use('/api/profile',profileRoutes);
app.use('/api',securityRoutes);
if (env.production) {
  const clientDist=fileURLToPath(new URL('../../client/dist/',import.meta.url));
  app.use(express.static(clientDist,{index:false}));
  app.get('*',(req,res,next)=>{
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(fileURLToPath(new URL('../../client/dist/index.html',import.meta.url)));
  });
}
app.use(notFound);
app.use(errorHandler);
export default app;
