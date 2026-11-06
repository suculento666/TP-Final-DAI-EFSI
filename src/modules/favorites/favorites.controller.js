import { favoritesService } from './favorites.service.js';
import { catchAsync } from '../../utils/catchAsync.js';

export const favoritesController = {
  add: catchAsync(async (req, res) => {
    const item = await favoritesService.set(req.user.id, req.params.contenidoId, true);
    res.json({ success: true, data: { item } });
  }),

  remove: catchAsync(async (req, res) => {
    const item = await favoritesService.set(req.user.id, req.params.contenidoId, false);
    res.json({ success: true, data: { item } });
  }),

  list: catchAsync(async (req, res) => {
    const items = await favoritesService.list(req.user.id);
    res.json({ success: true, data: { items } });
  }),
};
