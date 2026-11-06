import { usersService } from './users.service.js';
import { catchAsync } from '../../utils/catchAsync.js';

export const usersController = {
  me: catchAsync(async (req, res) => {
    const user = await usersService.getMe(req.user.id);
    res.json({ success: true, data: { user } });
  }),

  updateMe: catchAsync(async (req, res) => {
    const user = await usersService.updateMe(req.user.id, req.body);
    res.json({ success: true, data: { user } });
  }),
};
