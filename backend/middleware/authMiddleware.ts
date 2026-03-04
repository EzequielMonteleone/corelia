import type { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { AuthenticatedRequest } from "../types/index.js";
import { findUserById } from "../services/userService.js";
import { GlobalRole } from "@prisma/client";

export type { AuthenticatedRequest };

const JWT_SECRET = process.env.JWT_SECRET as jwt.Secret;

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.header("authorization") || req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "MISSING BEARER TOKEN" });
  }

  const token = authHeader.slice("Bearer ".length).trim();

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      sub?: string;
      email?: string;
      [key: string]: unknown;
    };

    if (!decoded.sub || !decoded.email) {
      return res.status(401).json({ error: "INVALID_TOKEN" });
    }

    req.user = {
      id: decoded.sub,
      email: decoded.email,
    };

    return next();
  } catch (err) {
    return res.status(401).json({ error: "INVALID_TOKEN" });
  }
}

export async function superAdminOnly(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user?.id) {
    return res.status(401).json({ error: "UNAUTHENTICATED" });
  }

  const user = await findUserById(req.user.id);
  if (!user || user.globalRole !== GlobalRole.SUPERADMIN) {
    return res.status(403).json({ error: "SUPER_ADMIN_ONLY" });
  }

  next();
}

