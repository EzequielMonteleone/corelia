import {prisma} from '../prismaClient.js';
import {canAccessBuilding} from '../lib/buildingAccess.js';
import {loadChatActor} from './chatActorService.js';

const DOCUMENT_KINDS = ['BYLAW', 'NOTICE'] as const;

export class DocumentError extends Error {
  status: number;

  constructor(code: string, status = 400) {
    super(code);
    this.status = status;
  }
}

async function actorFor(userId: string) {
  const actor = await loadChatActor(userId);
  if (!actor) throw new DocumentError('USER_NOT_FOUND', 404);
  return actor;
}

export async function listBuildingDocuments(userId: string, buildingId: string) {
  const actor = await actorFor(userId);
  if (!canAccessBuilding(actor, buildingId, 'member')) {
    throw new DocumentError('INSUFFICIENT_PERMISSIONS', 403);
  }

  const documents = await prisma.buildingDocument.findMany({
    where: {buildingId, kind: {in: [...DOCUMENT_KINDS]}},
    orderBy: {createdAt: 'desc'},
    select: {id: true, title: true, kind: true, createdAt: true},
  });

  return {
    canManage: canAccessBuilding(actor, buildingId, 'admin'),
    documents: documents.map(document => ({
      id: document.id,
      title: document.title,
      kind: document.kind,
      createdAt: document.createdAt.toISOString(),
    })),
  };
}

export async function getBuildingDocument(
  userId: string,
  buildingId: string,
  documentId: string,
) {
  const actor = await actorFor(userId);
  if (!canAccessBuilding(actor, buildingId, 'member')) {
    throw new DocumentError('INSUFFICIENT_PERMISSIONS', 403);
  }

  const document = await prisma.buildingDocument.findFirst({
    where: {id: documentId, buildingId, kind: {in: [...DOCUMENT_KINDS]}},
  });
  if (!document) throw new DocumentError('DOCUMENT_NOT_FOUND', 404);

  return {
    id: document.id,
    buildingId: document.buildingId,
    title: document.title,
    body: document.body,
    kind: document.kind,
    createdAt: document.createdAt.toISOString(),
    canManage: canAccessBuilding(actor, buildingId, 'admin'),
  };
}
