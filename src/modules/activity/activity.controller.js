import { activityService } from './activity.service.js';
import { catchAsync } from '../../utils/catchAsync.js';

export const activityController = {
  list: catchAsync(async (req, res) => {
    const items = await activityService.list(req.user.id, req.query);
    res.json({ success: true, data: { items } });
  }),
};
