import type {Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';
import type {AuthenticatedRequest} from '../types/index.js';
import {findUserById} from '../services/userService.js';
import {GlobalRole} from '@prisma/client';

export type {AuthenticatedRequest};

const JWT_SECRET = process.env.JWT_SECRET as jwt.Secret;

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.header('authorization') || req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({error: 'MISSING BEARER TOKEN'});
  }

  const token = authHeader.slice('Bearer '.length).trim();

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {algorithms: ['HS256']}) as {
      sub?: string;
      email?: string;
      [key: string]: unknown;
    };

    if (!decoded.sub || typeof decoded.sub !== 'string') {
      return res.status(401).json({error: 'INVALID_TOKEN'});
    }

    const user = await findUserById(decoded.sub);
    if (!user || !user.isActive) {
      return res.status(401).json({error: 'INVALID_TOKEN'});
    }

    req.user = {
      id: user.id,
      email: user.email,
    };

    return next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({error: 'INVALID_TOKEN'});
    }
    return next(err);
  }
}

export async function superAdminOnly(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  if (!req.user?.id) {
    return res.status(401).json({error: 'UNAUTHENTICATED'});
  }

  const user = await findUserById(req.user.id);
  if (!user || user.globalRole !== GlobalRole.SUPERADMIN) {
    return res.status(403).json({error: 'SUPER_ADMIN_ONLY'});
  }

  next();
}
