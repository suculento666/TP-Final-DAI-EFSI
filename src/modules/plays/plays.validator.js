import { z } from 'zod';

export const recordPlaySchema = z.object({
  contenidoId: z.number({ required_error: 'contenidoId es requerido' }).int().positive(),
  duracionSeg: z.number().int().positive().optional(),
});

export const listPlaysQuerySchema = z.object({
  limit:  z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});
