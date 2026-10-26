import {Router} from 'express';
import type {Response, NextFunction} from 'express';
import {
  authMiddleware,
  type AuthenticatedRequest,
} from '../middleware/authMiddleware.js';
import {loadChatActor} from '../services/chatActorService.js';
import {createBuildingDocument} from '../services/knowledgeService.js';
import {canAccessBuilding} from '../lib/chatAccess.js';

const router = Router({mergeParams: true});

const MAX_TITLE = 200;
const MAX_BODY = 100_000;

router.post(
  '/',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) return res.status(401).json({error: 'UNAUTHENTICATED'});
      const buildingId = req.params.buildingId;
      if (typeof buildingId !== 'string' || !buildingId) {
        return res.status(400).json({error: 'BUILDING_REQUIRED'});
      }

      const actor = await loadChatActor(req.user.id);
      if (!actor) return res.status(404).json({error: 'USER_NOT_FOUND'});
      if (!canAccessBuilding(actor, buildingId, 'admin')) {
        return res.status(403).json({error: 'INSUFFICIENT_PERMISSIONS'});
      }

      const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
      const body = typeof req.body?.body === 'string' ? req.body.body.trim() : '';
      const kind = req.body?.kind;
      if (!title || title.length > MAX_TITLE) {
        return res.status(400).json({error: 'INVALID_TITLE'});
      }
      if (!body || body.length > MAX_BODY) {
        return res.status(400).json({error: 'INVALID_BODY'});
      }
      if (kind !== 'BYLAW' && kind !== 'NOTICE') {
        return res.status(400).json({error: 'INVALID_KIND'});
      }

      const document = await createBuildingDocument({
        buildingId,
        title,
        body,
        kind,
      });
      return res.status(201).json({
        id: document.id,
        buildingId: document.buildingId,
        title: document.title,
        kind: document.kind,
      });
    } catch (err) {
      if (err instanceof Error && err.message === 'CHAT_NOT_CONFIGURED') {
        return res.status(503).json({error: 'CHAT_NOT_CONFIGURED'});
      }
      return next(err);
    }
  },
);

export default router;
