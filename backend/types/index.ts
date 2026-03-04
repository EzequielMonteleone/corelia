import type {Request} from 'express';

export type UserRoleName = 'Admin' | 'Owner' | 'Roomer';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}
