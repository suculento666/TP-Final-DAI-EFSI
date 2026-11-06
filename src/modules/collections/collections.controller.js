import { collectionsService } from './collections.service.js';
import { catchAsync } from '../../utils/catchAsync.js';

export const collectionsController = {
  list: catchAsync(async (req, res) => {
    const items = await collectionsService.list(req.user.id);
    res.json({ success: true, data: { items } });
  }),

  getOne: catchAsync(async (req, res) => {
    const data = await collectionsService.getOne(req.user.id, Number(req.params.id));
    res.json({ success: true, data });
  }),

  create: catchAsync(async (req, res) => {
    const collection = await collectionsService.create(req.user.id, req.body);
    res.status(201).json({ success: true, data: { collection } });
  }),

  update: catchAsync(async (req, res) => {
    const collection = await collectionsService.update(req.user.id, Number(req.params.id), req.body);
    res.json({ success: true, data: { collection } });
  }),

  remove: catchAsync(async (req, res) => {
    const result = await collectionsService.remove(req.user.id, Number(req.params.id));
    res.json({ success: true, data: result });
  }),

  addItem: catchAsync(async (req, res) => {
    const result = await collectionsService.addItem(req.user.id, Number(req.params.id), req.body.contenidoId);
    res.status(result.added ? 201 : 200).json({ success: true, data: result });
  }),

  removeItem: catchAsync(async (req, res) => {
    const result = await collectionsService.removeItem(req.user.id, Number(req.params.id), Number(req.params.contenidoId));
    res.json({ success: true, data: result });
  }),
};
