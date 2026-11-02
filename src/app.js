import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import config from './config/env.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();

// ── Middlewares globales ──────────────────────────────────────────────────────

app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(cookieParser());

// ── Rutas ─────────────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
    },
  });
});

// Los routers se registran aquí a medida que se implementa cada módulo:
// import authRouter from './modules/auth/auth.routes.js';
// app.use('/api/auth', authRouter);

// ── Ruta no encontrada ────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Ruta no encontrada',
    },
  });
});

// ── Manejo centralizado de errores ────────────────────────────────────────────

app.use(errorHandler);

export default app;
