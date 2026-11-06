import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validateBody } from '../../middlewares/validate.js';
import { registerSchema, loginSchema } from './auth.validator.js';
import { authenticate } from '../../middlewares/authenticate.js';

const router = Router();

// Rutas públicas
router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', validateBody(loginSchema), authController.login);
router.post('/logout', authController.logout);

// Ruta protegida: requiere sesión válida
router.get('/me', authenticate, authController.me);

export default router;
