import { reviewsService } from './reviews.service.js';
import { catchAsync } from '../../utils/catchAsync.js';

export const reviewsController = {
  list: catchAsync(async (req, res) => {
    const items = await reviewsService.listMine(req.user.id);
    res.json({ success: true, data: { items } });
  }),

  getByContenido: catchAsync(async (req, res) => {
    const review = await reviewsService.getMine(req.user.id, req.params.contenidoId);
    res.json({ success: true, data: { review } }); // null si el usuario no la reseñó
  }),

  create: catchAsync(async (req, res) => {
    const review = await reviewsService.create(req.user.id, req.params.contenidoId, req.body.texto);
    res.status(201).json({ success: true, data: { review } });
  }),

  update: catchAsync(async (req, res) => {
    const review = await reviewsService.update(req.user.id, req.params.contenidoId, req.body.texto);
    res.json({ success: true, data: { review } });
  }),

  remove: catchAsync(async (req, res) => {
    const result = await reviewsService.remove(req.user.id, req.params.contenidoId);
    res.json({ success: true, data: result });
  }),
};
