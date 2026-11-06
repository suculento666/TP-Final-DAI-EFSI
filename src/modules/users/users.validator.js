import { z } from 'zod';

// Edición de perfil. Todos opcionales (parche parcial). `strict()` rechaza
// campos no permitidos. null limpia avatar_url/bio; generos_preferidos es
// un array (la columna es TEXT[] NOT NULL, no admite null).
export const updateProfileSchema = z
  .object({
    avatar_url: z.string().url('avatar_url debe ser una URL válida').nullable().optional(),
    bio: z.string().max(300, 'bio no puede superar 300 caracteres').nullable().optional(),
    generos_preferidos: z.array(z.string()).optional(),
  })
  .strict();
