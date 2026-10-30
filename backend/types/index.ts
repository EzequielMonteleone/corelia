import type {Request} from 'express';

export type {
  BuildingAccessLevel,
  BuildingMember,
  BuildingMembership,
  BuildingRoleName,
  GlobalRoleName,
  LinkedUnit,
  ListedBuildings,
  MembershipUser,
  UnitLink,
  UnitRelationName,
} from './member.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}
