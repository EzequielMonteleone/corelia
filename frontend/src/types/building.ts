import {BuildingAmenity} from './amenity';
import {Unit} from './unit';

export interface Building {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  taxId?: string;
  active: boolean;
  units?: Unit[];
  buildingAmenities?: BuildingAmenity[];
}
