import { z } from 'zod';

// Validación de query de búsqueda. `strict()` evita parámetros desconocidos.
export const searchQuerySchema = z
  .object({
    q: z.string().min(1, 'El parámetro q es obligatorio'),
    tipo: z.enum(['track', 'album', 'both']).optional(),
    limit: z
      .string()
      .optional()
      .refine((v) => v === undefined || /^\d+$/.test(v), 'limit debe ser numérico'),
  })
  .strict();
