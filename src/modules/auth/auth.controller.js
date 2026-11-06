import { authService } from './auth.service.js';
import { TOKEN_COOKIE, cookieOptions } from '../../utils/jwt.js';
import { catchAsync } from '../../utils/catchAsync.js';

export const authController = {
  register: catchAsync(async (req, res) => {
    const { user, token } = await authService.register(req.body);
    // El token viaja en cookie HttpOnly; no se devuelve en el body.
    res.cookie(TOKEN_COOKIE, token, cookieOptions());
    res.status(201).json({ success: true, data: { user } });
  }),

  login: catchAsync(async (req, res) => {
    const { user, token } = await authService.login(req.body);
    res.cookie(TOKEN_COOKIE, token, cookieOptions());
    res.json({ success: true, data: { user } });
  }),

  logout: (req, res) => {
    res.clearCookie(TOKEN_COOKIE, { path: '/' });
    res.json({ success: true, data: { message: 'Sesión cerrada' } });
  },

  me: catchAsync(async (req, res) => {
    const user = await authService.me(req.user.id);
    res.json({ success: true, data: { user } });
  }),
};
