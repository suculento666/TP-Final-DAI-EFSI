import { Router } from 'express';
import { statisticsController } from './statistics.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';

const router = Router();

// GET /api/statistics — resumen personal con 8 indicadores dinámicos.
router.get('/', authenticate, statisticsController.summary);

export default router;
