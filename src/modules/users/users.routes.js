import { Router } from 'express';
import { usersController } from './users.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { validateBody } from '../../middlewares/validate.js';
import { updateProfileSchema } from './users.validator.js';

const router = Router();

// Todas protegidas: el usuario se identifica desde el JWT (req.user.id).
router.get('/me', authenticate, usersController.me);
router.patch('/me', authenticate, validateBody(updateProfileSchema), usersController.updateMe);

export default router;
