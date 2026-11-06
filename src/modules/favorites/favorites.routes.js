import { Router } from 'express';
import { favoritesController } from './favorites.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { validateParams } from '../../middlewares/validate.js';
import { contenidoIdParamSchema } from '../../validators/params.js';

const router = Router();

router.get('/', authenticate, favoritesController.list);
router.post('/:contenidoId', authenticate, validateParams(contenidoIdParamSchema), favoritesController.add);
router.delete('/:contenidoId', authenticate, validateParams(contenidoIdParamSchema), favoritesController.remove);

export default router;
