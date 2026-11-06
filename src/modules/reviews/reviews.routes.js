import { Router } from 'express';
import { reviewsController } from './reviews.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { validateBody, validateParams } from '../../middlewares/validate.js';
import { reviewBodySchema } from './reviews.validator.js';
import { contenidoIdParamSchema } from '../../validators/params.js';

const router = Router();

router.get('/', authenticate, reviewsController.list);
router.get('/:contenidoId', authenticate, validateParams(contenidoIdParamSchema), reviewsController.getByContenido);
router.post('/:contenidoId', authenticate, validateParams(contenidoIdParamSchema), validateBody(reviewBodySchema), reviewsController.create);
router.patch('/:contenidoId', authenticate, validateParams(contenidoIdParamSchema), validateBody(reviewBodySchema), reviewsController.update);
router.delete('/:contenidoId', authenticate, validateParams(contenidoIdParamSchema), reviewsController.remove);

export default router;
