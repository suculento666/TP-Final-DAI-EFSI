import { catalogService } from './catalog.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { notFound } from '../../utils/errors.js';

export const catalogController = {
  // GET /api/catalog/search?q=...&tipo=track|album|both&limit=
  search: catchAsync(async (req, res) => {
    const results = await catalogService.search(req.query);
    res.json({ success: true, data: results });
  }),

  // GET /api/catalog/:spotifyId?tipo=track|album
  detail: catchAsync(async (req, res) => {
    const { spotifyId } = req.params;
    const tipo = req.query.tipo === 'album' ? 'album' : 'track';
    const contenido = await catalogService.getAndPersistDetail(spotifyId, tipo);
    if (!contenido) throw notFound('Contenido no encontrado');
    res.json({ success: true, data: { contenido } });
  }),
};
