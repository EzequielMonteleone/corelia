import {z} from 'zod';

export const buildingSchema = z.object({
  name: z.string().min(3, 'Validation.nameMin3'),
  address: z.string().min(5, 'Validation.addressMin5'),
  city: z.string().min(2, 'Validation.cityMin2'),
  country: z.string().min(2, 'Validation.countryMin2'),
});

export type BuildingFormValues = z.infer<typeof buildingSchema>;