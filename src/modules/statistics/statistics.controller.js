import { statisticsService } from './statistics.service.js';
import { catchAsync } from '../../utils/catchAsync.js';

export const statisticsController = {
  summary: catchAsync(async (req, res) => {
    const stats = await statisticsService.getSummary(req.user.id);
    res.json({ success: true, data: stats });
  }),
};
