import {z} from 'zod';

export const loginSchema = z.object({
  email: z.email({message: 'Validation.emailInvalid'}),
  password: z.string().min(6, {message: 'Validation.passwordMin6'}),
});

export type LoginFormValues = z.infer<typeof loginSchema>;