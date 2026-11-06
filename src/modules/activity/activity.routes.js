import { Router } from 'express';
import { activityController } from './activity.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { validateQuery } from '../../middlewares/validate.js';
import { activityQuerySchema } from './activity.validator.js';

const router = Router();

// Solo el usuario ve su propia actividad (filtrado por req.user.id).
router.get('/', authenticate, validateQuery(activityQuerySchema), activityController.list);

export default router;
