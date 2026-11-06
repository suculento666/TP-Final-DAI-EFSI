import { Router } from 'express';
import { collectionsController } from './collections.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { validateBody, validateParams } from '../../middlewares/validate.js';
import { createCollectionSchema, updateCollectionSchema, addItemSchema } from './collections.validator.js';
import { idParamSchema, collectionItemParamsSchema } from '../../validators/params.js';

const router = Router();

router.get('/', authenticate, collectionsController.list);
router.get('/:id', authenticate, validateParams(idParamSchema), collectionsController.getOne);
router.post('/', authenticate, validateBody(createCollectionSchema), collectionsController.create);
router.patch('/:id', authenticate, validateParams(idParamSchema), validateBody(updateCollectionSchema), collectionsController.update);
router.delete('/:id', authenticate, validateParams(idParamSchema), collectionsController.remove);
router.post('/:id/items', authenticate, validateParams(idParamSchema), validateBody(addItemSchema), collectionsController.addItem);
router.delete('/:id/items/:contenidoId', authenticate, validateParams(collectionItemParamsSchema), collectionsController.removeItem);

export default router;
