import { Router } from "express";
import type { Response, NextFunction } from "express";
import { authMiddleware, type AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { findUserById } from "../services/userService.js";

const router = Router();

router.get(
  "/me",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "UNAUTHENTICATED" });
      }

      const user = await findUserById(req.user.id);

      if (!user || !user.isActive) {
        return res.status(404).json({ error: "USER_NOT_FOUND" });
      }

      return res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (err) {
      return next(err);
    }
  }
);

export default router;
