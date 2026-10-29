import {Router} from 'express';
import rateLimit from 'express-rate-limit';
import type {Request, Response, NextFunction} from 'express';
import {
  authMiddleware,
  type AuthenticatedRequest,
} from '../middleware/authMiddleware.js';
import {
  ChatError,
  confirmChatDraft,
  getChatThread,
  runChatTurn,
} from '../services/chatService.js';

const router = Router();

function chatUserKey(req: Request): string {
  const userId = (req as AuthenticatedRequest).user?.id;
  return userId ?? 'anonymous';
}

function chatDailyLimit(): number {
  const raw = Number(process.env.CHAT_DAILY_LIMIT);
  if (Number.isFinite(raw) && raw > 0) return Math.floor(raw);
  return 200;
}

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: {error: 'TOO_MANY_REQUESTS'},
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => chatUserKey(req),
});

const chatDailyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: chatDailyLimit(),
  message: {error: 'TOO_MANY_REQUESTS'},
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => chatUserKey(req),
});

function sendChatError(err: unknown, res: Response, next: NextFunction) {
  if (err instanceof ChatError) {
    return res.status(err.status).json({error: err.message});
  }
  return next(err);
}

router.post(
  '/',
  authMiddleware,
  chatLimiter,
  chatDailyLimiter,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id)
        return res.status(401).json({error: 'UNAUTHENTICATED'});
      const message = req.body?.message;
      const threadId = req.body?.threadId;
      if (typeof message !== 'string') {
        return res.status(400).json({error: 'MESSAGE_REQUIRED'});
      }
      if (threadId !== undefined && typeof threadId !== 'string') {
        return res.status(400).json({error: 'INVALID_THREAD'});
      }
      const result = await runChatTurn({
        userId: req.user.id,
        message,
        ...(typeof threadId === 'string' ? {threadId} : {}),
      });
      return res.json(result);
    } catch (err) {
      return sendChatError(err, res, next);
    }
  },
);

router.get(
  '/threads/:threadId',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id)
        return res.status(401).json({error: 'UNAUTHENTICATED'});
      const thread = await getChatThread(
        req.user.id,
        req.params.threadId as string,
      );
      return res.json(thread);
    } catch (err) {
      return sendChatError(err, res, next);
    }
  },
);

router.post(
  '/drafts/:draftId/confirm',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id)
        return res.status(401).json({error: 'UNAUTHENTICATED'});
      const result = await confirmChatDraft(
        req.user.id,
        req.params.draftId as string,
      );
      return res.json(result);
    } catch (err) {
      return sendChatError(err, res, next);
    }
  },
);

export default router;
