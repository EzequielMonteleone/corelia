import {Building} from './building';
import {Role} from './role';
import {Unit} from './unit';

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

export const USER_AUDIT_ACTIONS = [
  'USER_PASSWORD_CHANGED',
  'USER_PASSWORD_RESET',
  'USER_ROLE_CHANGED',
  'USER_ACTIVE_CHANGED',
] as const;

export type UserAuditAction = (typeof USER_AUDIT_ACTIONS)[number];

export interface UserAuditMetadata {
  isActive?: boolean;
  previousRole?: string | null;
  nextRole?: string;
  previousUnitIds?: string[];
  unitIds?: string[];
}

export interface UserAuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  periodId: string | null;
  buildingId: string | null;
  actorUserId: string;
  actorName: string | null;
  metadata: UserAuditMetadata | null;
  createdAt: string;
}

export function isUserAuditAction(action: string): action is UserAuditAction {
  return (USER_AUDIT_ACTIONS as readonly string[]).includes(action);
}

export interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  globalRole: string;
  isActive: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  buildingUsers: BuildingUser[];
  userUnits?: {
    id: string;
    relationType: 'OWNER' | 'ROOMER';
    unit: Unit;
  }[];
}
