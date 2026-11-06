import { z } from 'zod';

// Registro: nombre de usuario, correo, contraseña y confirmación.
// La confirmación debe coincidir con la contraseña (refine).
export const registerSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
      .max(30, 'El nombre de usuario no puede superar 30 caracteres'),
    email: z.string().trim().email('El correo no es válido'),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .max(72, 'La contraseña no puede superar 72 caracteres'),
    passwordConfirm: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: 'Las contraseñas no coinciden',
    path: ['passwordConfirm'],
  });

export const loginSchema = z.object({
  email: z.string().trim().email('El correo no es válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});
