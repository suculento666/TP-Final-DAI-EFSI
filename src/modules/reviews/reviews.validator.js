import { z } from 'zod';

// El CHECK de la tabla exige length(trim(texto)) > 0; acá lo reforzamos.
export const reviewBodySchema = z
  .object({
    texto: z
      .string()
      .trim()
      .min(1, 'El texto no puede estar vacío')
      .max(10000, 'El texto es demasiado largo'),
  })
  .strict();
