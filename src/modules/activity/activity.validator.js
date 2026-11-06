import { z } from 'zod';
import { VALID_ACTIVITY_TYPES } from './activity.constants.js';

export const activityQuerySchema = z
  .object({
    limit: z.string().regex(/^\d+$/, 'limit debe ser numérico').optional(),
    tipo: z.enum(VALID_ACTIVITY_TYPES).optional(),
  })
  .strict();
