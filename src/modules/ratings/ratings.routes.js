import { Router } from 'express';
import { ratingsController } from './ratings.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { validateBody, validateParams } from '../../middlewares/validate.js';
import { ratingBodySchema } from './ratings.validator.js';
import { contenidoIdParamSchema } from '../../validators/params.js';

const router = Router();

router.get('/', authenticate, ratingsController.list);
router.put(
  '/:contenidoId',
  authenticate,
  validateParams(contenidoIdParamSchema),
  validateBody(ratingBodySchema),
  ratingsController.set
);
router.delete('/:contenidoId', authenticate, validateParams(contenidoIdParamSchema), ratingsController.clear);

export default router;
