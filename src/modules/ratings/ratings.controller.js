import { ratingsService } from './ratings.service.js';
import { catchAsync } from '../../utils/catchAsync.js';

export const ratingsController = {
  set: catchAsync(async (req, res) => {
    const item = await ratingsService.set(req.user.id, Number(req.params.contenidoId), req.body.puntuacion);
    res.json({ success: true, data: { item } });
  }),

  clear: catchAsync(async (req, res) => {
    const item = await ratingsService.clear(req.user.id, Number(req.params.contenidoId));
    res.json({ success: true, data: { item } });
  }),

  list: catchAsync(async (req, res) => {
    const items = await ratingsService.list(req.user.id);
    res.json({ success: true, data: { items } });
  }),
};
