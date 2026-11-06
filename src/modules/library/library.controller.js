import { libraryService } from './library.service.js';
import { catchAsync } from '../../utils/catchAsync.js';

export const libraryController = {
  list: catchAsync(async (req, res) => {
    const items = await libraryService.list(req.user.id, req.query);
    res.json({ success: true, data: { items } });
  }),

  add: catchAsync(async (req, res) => {
    const item = await libraryService.add(req.user.id, req.body);
    res.status(201).json({ success: true, data: { item } });
  }),

  updateEstado: catchAsync(async (req, res) => {
    const item = await libraryService.updateEstado(
      req.user.id,
      Number(req.params.contenidoId),
      req.body.estado
    );
    res.json({ success: true, data: { item } });
  }),

  remove: catchAsync(async (req, res) => {
    const result = await libraryService.remove(req.user.id, Number(req.params.contenidoId));
    res.json({ success: true, data: result });
  }),
};
