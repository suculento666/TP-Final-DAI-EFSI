import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import config from './config/env.js';
import errorHandler from './middlewares/errorHandler.js';
import authRouter from './modules/auth/auth.routes.js';
import usersRouter from './modules/users/users.routes.js';
import catalogRouter from './modules/catalog/catalog.routes.js';
import libraryRouter from './modules/library/library.routes.js';

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

// Rutas de autenticación
app.use('/api/auth', authRouter);

// Rutas de perfil de usuario
app.use('/api/users', usersRouter);

// Rutas de catálogo (Spotify)
app.use('/api/catalog', catalogRouter);

// Rutas de biblioteca
app.use('/api/library', libraryRouter);

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
