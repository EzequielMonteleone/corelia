import {z} from 'zod';

export const roleSchema = z.object({
  name: z.string().min(3, 'Validation.nameMin3'),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).optional(),
});

export type RoleFormValues = z.infer<typeof roleSchema>;