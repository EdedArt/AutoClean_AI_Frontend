import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string({ message: 'validation.emailRequired' })
    .trim()
    .toLowerCase()
    .min(1, 'validation.emailRequired')
    .email('validation.emailInvalid')
    .max(100, 'validation.emailMax'),
  password: z
    .string({ message: 'validation.passwordRequired' })
    .min(1, 'validation.passwordRequired')
    .max(12, 'validation.passwordMax'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    nombre: z
      .string({ message: 'validation.nameRequired' })
      .trim()
      .min(2, 'validation.nameMin')
      .max(60, 'validation.nameMax'),
    email: z
      .string({ message: 'validation.emailRequired' })
      .trim()
      .toLowerCase()
      .min(1, 'validation.emailRequired')
      .email('validation.emailInvalid')
      .max(100, 'validation.emailMax'),
    password: z
      .string({ message: 'validation.passwordRequired' })
      .min(8, 'validation.passwordLength')
      .max(12, 'validation.passwordLength'),
    confirmPassword: z
      .string({ message: 'validation.confirmPasswordRequired' })
      .min(1, 'validation.confirmPasswordRequired'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'validation.passwordsMismatch',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
