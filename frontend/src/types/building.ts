import {BuildingAmenity} from './amenity';
import {Unit} from './unit';

export interface AssignableRole {
  name: 'Admin' | 'Owner' | 'Roomer';
  unitSelection: 'none' | 'one' | 'many';
  relation: 'OWNER' | 'ROOMER' | null;
}

export interface Building {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  taxId?: string;
  active: boolean;
  canManage?: boolean;
  canDelete?: boolean;
  assignableRoles?: AssignableRole[];
  roleCatalog?: AssignableRole[];
  units?: Unit[];
  buildingAmenities?: BuildingAmenity[];
}
