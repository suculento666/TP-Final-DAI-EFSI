import { Router } from 'express';
import { libraryController } from './library.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { validateBody, validateQuery, validateParams } from '../../middlewares/validate.js';
import { addItemSchema, updateEstadoSchema, listQuerySchema } from './library.validator.js';
import { contenidoIdParamSchema } from '../../validators/params.js';

const router = Router();

// Todas protegidas y filtradas por req.user.id.
router.get('/', authenticate, validateQuery(listQuerySchema), libraryController.list);
router.post('/', authenticate, validateBody(addItemSchema), libraryController.add);
router.patch('/:contenidoId', authenticate, validateParams(contenidoIdParamSchema), validateBody(updateEstadoSchema), libraryController.updateEstado);
router.delete('/:contenidoId', authenticate, validateParams(contenidoIdParamSchema), libraryController.remove);

export default router;
