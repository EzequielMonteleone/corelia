import {Router} from 'express';
import rateLimit from 'express-rate-limit';
import type {Request, Response, NextFunction} from 'express';
import {verifyCredentials, generateJwt} from '../services/authService.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {error: 'TOO_MANY_REQUESTS'},
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  '/login',
  loginLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {email, password} = req.body ?? {};

      if (typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({error: 'INVALID_PAYLOAD'});
      }

      const user = await verifyCredentials(email, password);
      const token = generateJwt(user);

      const safeUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone ?? undefined,
        globalRole: user.globalRole,
        isActive: user.isActive,
        buildingUsers: user.buildingUsers,
        userUnits: user.userUnits,
      };

      return res.json({
        token,
        user: safeUser,
      });
    } catch (err) {
      if (err instanceof Error && err.message === 'INVALID_CREDENTIALS') {
        return res.status(401).json({error: 'INVALID_CREDENTIALS'});
      }

      return next(err);
    }
  },
);

export default router;
