import express from 'express';
import cors from 'cors';
import env from './config/env.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';
import healthRoutes from './features/health/health.routes.js';
import dlpRoutes from './features/dlp/dlp.routes.js';

/**
 * app.js configura la aplicación Express (middlewares y rutas).
 * No inicia el servidor aquí: eso ocurre en server.js.
 *
 * A medida que se agreguen features (auth, transfers, dlp, etc.)
 * cada una debe montar sus propias rutas aquí, siguiendo el
 * mismo patrón que /api/health.
 */
const app = express();

app.use(cors({ origin: env.clientOrigin }));
app.use(express.json({ limit: '100kb' }));

app.use('/api/health', healthRoutes);
app.use('/api/dlp', dlpRoutes);

// Futuras rutas de features se agregarán aquí, por ejemplo:
// app.use('/api/auth', authRoutes);
// app.use('/api/transfers', transfersRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
