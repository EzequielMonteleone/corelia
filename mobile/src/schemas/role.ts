import {z} from 'zod';

export const roleSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).optional(),
});

export type RoleFormValues = z.infer<typeof roleSchema>;
