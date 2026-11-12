import type {NextFunction, Response} from 'express';
import {Router} from 'express';
import {canAccessBuilding} from '../lib/buildingAccess.js';
import {authMiddleware} from '../middleware/authMiddleware.js';
import {loadChatActor} from '../services/chatActorService.js';
import {
  DocumentError,
  getBuildingDocument,
  listBuildingDocuments,
} from '../services/documentService.js';
import {createBuildingDocument} from '../services/knowledgeService.js';
import type {AuthenticatedRequest} from '../types/index.js';

const router = Router({mergeParams: true});

const MAX_TITLE = 200;
const MAX_BODY = 100_000;

function buildingIdFrom(req: AuthenticatedRequest) {
  const buildingId = req.params.buildingId;
  return typeof buildingId === 'string' && buildingId ? buildingId : null;
}

function documentError(err: unknown, res: Response) {
  if (err instanceof DocumentError) {
    res.status(err.status).json({error: err.message});
    return true;
  }
  if (err instanceof Error && err.message === 'CHAT_NOT_CONFIGURED') {
    res.status(503).json({error: 'CHAT_NOT_CONFIGURED'});
    return true;
  }
  return false;
}

router.get(
  '/',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id)
        return res.status(401).json({error: 'UNAUTHENTICATED'});
      const buildingId = buildingIdFrom(req);
      if (!buildingId)
        return res.status(400).json({error: 'BUILDING_REQUIRED'});
      return res.json(await listBuildingDocuments(req.user.id, buildingId));
    } catch (err) {
      if (documentError(err, res)) return;
      return next(err);
    }
  },
);

router.get(
  '/:documentId',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id)
        return res.status(401).json({error: 'UNAUTHENTICATED'});
      const buildingId = buildingIdFrom(req);
      const documentId = req.params.documentId;
      if (!buildingId)
        return res.status(400).json({error: 'BUILDING_REQUIRED'});
      if (typeof documentId !== 'string' || !documentId) {
        return res.status(404).json({error: 'DOCUMENT_NOT_FOUND'});
      }
      return res.json(
        await getBuildingDocument(req.user.id, buildingId, documentId),
      );
    } catch (err) {
      if (documentError(err, res)) return;
      return next(err);
    }
  },
);

router.post(
  '/',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id)
        return res.status(401).json({error: 'UNAUTHENTICATED'});
      const buildingId = req.params.buildingId;
      if (typeof buildingId !== 'string' || !buildingId) {
        return res.status(400).json({error: 'BUILDING_REQUIRED'});
      }

      const actor = await loadChatActor(req.user.id);
      if (!actor) return res.status(404).json({error: 'USER_NOT_FOUND'});
      if (!canAccessBuilding(actor, buildingId, 'admin')) {
        return res.status(403).json({error: 'INSUFFICIENT_PERMISSIONS'});
      }

      const title =
        typeof req.body?.title === 'string' ? req.body.title.trim() : '';
      const body =
        typeof req.body?.body === 'string' ? req.body.body.trim() : '';
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
        actorUserId: req.user.id,
      });
      return res.status(201).json({
        id: document.id,
        buildingId: document.buildingId,
        title: document.title,
        kind: document.kind,
      });
    } catch (err) {
      if (documentError(err, res)) return;
      return next(err);
    }
  },
);

export default router;
