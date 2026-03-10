import * as z from 'zod';

export const loginSchema = z.object({
  email: z.email({error: 'Email inválido'}),
  password: z
    .string()
    .min(6, {error: 'La contraseña debe tener al menos 6 caracteres'}),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
