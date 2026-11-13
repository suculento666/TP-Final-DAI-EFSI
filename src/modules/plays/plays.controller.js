import { playsService } from './plays.service.js';
import { catchAsync } from '../../utils/catchAsync.js';

export const playsController = {
  record: catchAsync(async (req, res) => {
    const play = await playsService.record(req.user.id, req.body);
    res.status(201).json({ success: true, data: { play } });
  }),

  list: catchAsync(async (req, res) => {
    const plays = await playsService.list(req.user.id, req.query);
    res.json({ success: true, data: { plays } });
  }),

  wrapped: catchAsync(async (req, res) => {
    const data = await playsService.wrapped(req.user.id);
    res.json({ success: true, data });
  }),
};
