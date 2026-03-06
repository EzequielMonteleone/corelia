import {Building} from './building';
import {Role} from './role';

export interface BuildingUser {
  id: string;
  buildingId: string;
  userId: string;
  roleId: string;
  createdAt: string;
  updatedAt: string;
  building?: Building;
  role?: Role;
}

export interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  globalRole: string;
  isActive: boolean;
  buildingUsers: BuildingUser[];
}
