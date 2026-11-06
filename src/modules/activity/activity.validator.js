import { z } from 'zod';
import { VALID_TYPES } from './activity.repository.js';

export const activityQuerySchema = z
  .object({
    limit: z.string().regex(/^\d+$/, 'limit debe ser numérico').optional(),
    tipo: z.enum(VALID_TYPES).optional(),
  })
  .strict();
