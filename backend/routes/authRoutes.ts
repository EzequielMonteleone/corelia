import {Router} from 'express';
import type {Request, Response, NextFunction} from 'express';
import {verifyCredentials, generateJwt} from '../services/authService.js';

const router = Router();

router.post(
  '/login',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {email, password} = req.body ?? {};

      if (typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({error: 'INVALID_PAYLOAD'});
      }

      const user = await verifyCredentials(email, password);
      const token = generateJwt(user);

      return res.json({
        token,
        user,
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
