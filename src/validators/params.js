import { z } from 'zod';

// Esquemas de parámetros de ruta reutilizables (validación con Zod).
// coerce.number() convierte "5" -> 5 y "abc" -> NaN (falla int/positive).
// No son strict: ignoran claves extra de params, así no rompen rutas con varios IDs.
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const contenidoIdParamSchema = z.object({
  contenidoId: z.coerce.number().int().positive(),
});

// Para rutas con dos IDs: /api/collections/:id/items/:contenidoId
export const collectionItemParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  contenidoId: z.coerce.number().int().positive(),
});
