import { z } from 'zod';

export const ratingBodySchema = z
  .object({
    puntuacion: z
      .number()
      .int('La puntuación debe ser un número entero')
      .min(1, 'La puntuación mínima es 1')
      .max(5, 'La puntuación máxima es 5'),
  })
  .strict();
