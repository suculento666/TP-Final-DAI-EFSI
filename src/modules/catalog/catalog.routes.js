import { Router } from 'express';
import { catalogController } from './catalog.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { validateQuery } from '../../middlewares/validate.js';
import { searchQuerySchema } from './catalog.validator.js';

const router = Router();

// Búsqueda y detalle requieren sesión.
router.get('/search', authenticate, validateQuery(searchQuerySchema), catalogController.search);
router.get('/:spotifyId', authenticate, catalogController.detail);

export default router;
