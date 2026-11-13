import {z} from 'zod';

export const buildingSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  address: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
  city: z.string().min(2, 'La ciudad debe tener al menos 2 caracteres'),
  country: z.string().min(2, 'El país debe tener al menos 2 caracteres'),
});

export type BuildingFormValues = z.infer<typeof buildingSchema>;
