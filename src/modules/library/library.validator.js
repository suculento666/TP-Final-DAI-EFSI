import { z } from 'zod';

// Solo ID y tipo son necesarios. Los metadatos anteriores se aceptan por
// compatibilidad, pero se descartan: el servidor los obtiene desde Spotify.
const contenidoSchema = z
  .object({
    spotify_id: z.string().min(1),
    tipo: z.enum(['track', 'album']),
    titulo: z.string().min(1).optional(),
    artista: z.string().nullable().optional(),
    album: z.string().nullable().optional(),
    generos: z.array(z.string()).optional(),
    portada_url: z.string().url().nullable().optional(),
    duracion_ms: z.number().int().positive().nullable().optional(),
    total_canciones: z.number().int().positive().nullable().optional(),
    fecha_lanzamiento: z.string().nullable().optional(),
  })
  .strict()
  .transform(({ spotify_id, tipo }) => ({ spotify_id, tipo }));

export const addItemSchema = z
  .object({
    contenido: contenidoSchema,
    estado: z.enum(['quiero_escuchar', 'escuchando', 'escuchado']).optional(),
  })
  .strict();

export const updateEstadoSchema = z
  .object({
    estado: z.enum(['quiero_escuchar', 'escuchando', 'escuchado']),
  })
  .strict();

export const listQuerySchema = z
  .object({
    estado: z.enum(['quiero_escuchar', 'escuchando', 'escuchado']).optional(),
    favorito: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
    orderBy: z.enum(['agregado_en', 'actualizado_en', 'titulo']).optional(),
  })
  .strict();
