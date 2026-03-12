import {z} from 'zod';

export const userCreateSchema = z
  .object({
    email: z.string().email('Email inválido'),
    firstName: z.string().min(2, 'Mínimo 2 caracteres'),
    lastName: z.string().min(2, 'Mínimo 2 caracteres'),
    phone: z.string().optional(),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    globalRole: z.enum(['SUPERADMIN']).optional(),
    roleName: z.enum(['Admin', 'Owner', 'Roomer']).optional(),
    buildingId: z.string().optional(),
    unitIds: z.array(z.string()).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.globalRole === 'SUPERADMIN') {
      if (value.roleName || value.buildingId) {
        ctx.addIssue({
          path: ['globalRole'],
          code: z.ZodIssueCode.custom,
          message: 'Un superadmin global no debe tener edificio ni roleName.',
        });
      }
      return;
    }

    if (!value.roleName) {
      ctx.addIssue({
        path: ['roleName'],
        code: z.ZodIssueCode.custom,
        message: 'El rol es obligatorio.',
      });
    }
    if (!value.buildingId) {
      ctx.addIssue({
        path: ['buildingId'],
        code: z.ZodIssueCode.custom,
        message: 'El edificio es obligatorio.',
      });
    }
  });

export const userEditSchema = z.object({
  email: z.string().email('Email inválido'),
  firstName: z.string().min(2, 'Mínimo 2 caracteres'),
  lastName: z.string().min(2, 'Mínimo 2 caracteres'),
  phone: z.string().optional(),
  password: z.string().optional(),
  isActive: z.boolean().optional(),
  buildingId: z.string().optional(),
  roleName: z.enum(['Admin', 'Owner', 'Roomer']).optional(),
  unitIds: z.array(z.string()).optional(),
});

export type UserCreateFormValues = z.infer<typeof userCreateSchema>;
export type UserEditFormValues = z.infer<typeof userEditSchema>;
