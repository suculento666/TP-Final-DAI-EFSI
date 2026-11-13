import { Router } from 'express';
import { playsController } from './plays.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { validate } from '../../middlewares/validate.js';
import { recordPlaySchema, listPlaysQuerySchema } from './plays.validator.js';

const router = Router();

// POST /api/plays — registra una reproducción
router.post('/', authenticate, validate({ body: recordPlaySchema }), playsController.record);

// GET /api/plays — historial de reproducciones del usuario
router.get('/', authenticate, validate({ query: listPlaysQuerySchema }), playsController.list);

// GET /api/plays/wrapped — estadísticas estilo Spotify Wrapped
router.get('/wrapped', authenticate, playsController.wrapped);

export default router;
