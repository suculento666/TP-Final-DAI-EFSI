import { Router } from 'express';
import { playsController } from './plays.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { validateBody, validateQuery } from '../../middlewares/validate.js';
import { recordPlaySchema, listPlaysQuerySchema } from './plays.validator.js';

const router = Router();

// GET /wrapped debe registrarse ANTES que GET / para que Express no lo trate
// como un parámetro dinámico de una ruta futura.

// GET /api/plays/wrapped — estadísticas estilo Spotify Wrapped
router.get('/wrapped', authenticate, playsController.wrapped);

// POST /api/plays — registra una reproducción
router.post('/', authenticate, validateBody(recordPlaySchema), playsController.record);

// GET /api/plays — historial de reproducciones del usuario
router.get('/', authenticate, validateQuery(listPlaysQuerySchema), playsController.list);

export default router;
