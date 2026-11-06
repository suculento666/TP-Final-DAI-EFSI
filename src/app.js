import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import config from './config/env.js';
import errorHandler from './middlewares/errorHandler.js';
import authRouter from './modules/auth/auth.routes.js';
import usersRouter from './modules/users/users.routes.js';
import catalogRouter from './modules/catalog/catalog.routes.js';
import libraryRouter from './modules/library/library.routes.js';
import favoritesRouter from './modules/favorites/favorites.routes.js';
import ratingsRouter from './modules/ratings/ratings.routes.js';
import reviewsRouter from './modules/reviews/reviews.routes.js';
import collectionsRouter from './modules/collections/collections.routes.js';
import activityRouter from './modules/activity/activity.routes.js';
import statisticsRouter from './modules/statistics/statistics.routes.js';

const app = express();

// ── Middlewares globales ──────────────────────────────────────────────────────

app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
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

// Rutas de favoritos y puntuaciones (sobre biblioteca_items)
app.use('/api/favorites', favoritesRouter);
app.use('/api/ratings', ratingsRouter);

// Rutas de reseñas
app.use('/api/reviews', reviewsRouter);

// Rutas de colecciones
app.use('/api/collections', collectionsRouter);

// Rutas de actividad
app.use('/api/activity', activityRouter);

// Rutas de estadísticas
app.use('/api/statistics', statisticsRouter);

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
