import {z} from 'zod';

export const userCreateSchema = z
  .object({
    email: z.email('Validation.emailInvalid'),
    firstName: z.string().min(2, 'Validation.min2'),
    lastName: z.string().min(2, 'Validation.min2'),
    phone: z.string().optional(),
    password: z.string().min(8, 'Validation.min8'),
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
          code: 'custom',
          message: 'Validation.superadminNoBuilding',
        });
      }
      return;
    }

    if (!value.roleName) {
      ctx.addIssue({
        path: ['roleName'],
        code: 'custom',
        message: 'Validation.roleRequired',
      });
    }
    if (!value.buildingId) {
      ctx.addIssue({
        path: ['buildingId'],
        code: 'custom',
        message: 'Validation.buildingRequired',
      });
    }
  });

export const userEditSchema = z.object({
  email: z.email('Validation.emailInvalid'),
  firstName: z.string().min(2, 'Validation.min2'),
  lastName: z.string().min(2, 'Validation.min2'),
  phone: z.string().optional(),
  password: z
    .string()
    .refine(value => value.length === 0 || value.length >= 8, {
      message: 'Validation.min8',
    }),
  currentPassword: z.string().optional(),
  isActive: z.boolean().optional(),
  buildingId: z.string().optional(),
  roleName: z.enum(['Admin', 'Owner', 'Roomer']).optional(),
  unitIds: z.array(z.string()).optional(),
});

export type UserCreateFormValues = z.infer<typeof userCreateSchema>;
export type UserEditFormValues = z.infer<typeof userEditSchema>;

export const profileSchema = z.object({
  email: z.email('Validation.emailInvalid'),
  firstName: z.string().min(2, 'Validation.min2'),
  lastName: z.string().min(2, 'Validation.min2'),
  phone: z.string().optional(),
  password: z
    .string()
    .refine(value => value.length === 0 || value.length >= 8, {
      message: 'Validation.min8',
    }),
  currentPassword: z.string().optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
