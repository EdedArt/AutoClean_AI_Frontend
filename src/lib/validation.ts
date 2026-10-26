import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string({ message: 'El correo es obligatorio' })
    .trim()
    .toLowerCase()
    .min(1, 'El correo es obligatorio')
    .email('Formato de correo no válido')
    .max(100, 'El correo no puede tener más de 100 caracteres'),
  password: z
    .string({ message: 'La contraseña es obligatoria' })
    .min(1, 'La contraseña es obligatoria')
    .max(12, 'La contraseña no puede tener más de 12 caracteres'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    nombre: z
      .string({ message: 'El nombre es obligatorio' })
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(60, 'El nombre no puede tener más de 60 caracteres'),
    email: z
      .string({ message: 'El correo es obligatorio' })
      .trim()
      .toLowerCase()
      .min(1, 'El correo es obligatorio')
      .email('Formato de correo no válido')
      .max(100, 'El correo no puede tener más de 100 caracteres'),
    password: z
      .string({ message: 'La contraseña es obligatoria' })
      .min(8, 'La contraseña debe tener entre 8 y 12 caracteres')
      .max(12, 'La contraseña debe tener entre 8 y 12 caracteres'),
    confirmPassword: z
      .string({ message: 'Confirma tu contraseña' })
      .min(1, 'Confirma tu contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
