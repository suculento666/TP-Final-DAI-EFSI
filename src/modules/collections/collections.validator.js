import { z } from 'zod';

const colorRegex = /^#[0-9A-Fa-f]{6}$/;

export const createCollectionSchema = z
  .object({
    nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(100, 'Máximo 100 caracteres'),
    descripcion: z.string().max(300, 'Máximo 300 caracteres').nullable().optional(),
    color: z.string().regex(colorRegex, 'color debe tener formato #RRGGBB').nullable().optional(),
  })
  .strict();

export const updateCollectionSchema = z
  .object({
    nombre: z.string().trim().min(1).max(100).optional(),
    descripcion: z.string().max(300).nullable().optional(),
    color: z.string().regex(colorRegex, 'color debe tener formato #RRGGBB').nullable().optional(),
  })
  .strict();

export const addItemSchema = z
  .object({
    contenidoId: z.number().int().positive('contenidoId debe ser un entero positivo'),
  })
  .strict();
