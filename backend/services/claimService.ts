import {
  ClaimDraftStatus,
  type Claim,
  type ClaimDraft,
  type ClaimStatus,
} from '@prisma/client';
import {prisma} from '../prismaClient.js';
import {findUserById} from './userService.js';
import {toBuildingMember} from '../lib/buildingAccess.js';
import {
  canManageClaim,
  claimAmenityAccess,
  claimCreateAccess,
  claimDraftConfirmAccess,
  claimListScope,
  parseClaimCreate,
  parseClaimTarget,
  parseClaimUpdate,
  residentUnitIds,
  type ClaimActor,
  type ClaimListScope,
  type ClaimStatusName,
  type ClaimUpdateInput,
} from '../lib/claimRules.js';

const DRAFT_TTL_MS = 30 * 60 * 1000;

export class ClaimError extends Error {
  status: number;

  constructor(code: string, status = 400) {
    super(code);
    this.status = status;
  }
}

const claimInclude = {
  unit: {select: {name: true}},
  buildingAmenity: {select: {amenity: {select: {name: true}}}},
  author: {select: {id: true, firstName: true, lastName: true}},
} as const;

type ClaimRow = Claim & {
  unit: {name: string} | null;
  buildingAmenity: {amenity: {name: string}} | null;
  author: {id: string; firstName: string; lastName: string};
};

export type PresentedClaim = {
  id: string;
  buildingId: string;
  unitId: string | null;
  unitName: string | null;
  buildingAmenityId: string | null;
  amenityName: string | null;
  title: string;
  body: string;
  status: ClaimStatusName;
  author: {id: string; firstName: string; lastName: string};
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
  canManage: boolean;
};

export type PresentedClaimDraft = {
  id: string;
  kind: 'CREATE' | 'RESOLVE';
  title: string;
  body: string | null;
  unitName: string;
  amenityName: string | null;
  buildingName: string;
  nextStatus: ClaimStatusName | null;
  reply: string | null;
};

function toClaimActor(
  user: NonNullable<Awaited<ReturnType<typeof findUserById>>>,
): ClaimActor {
  const member = toBuildingMember(user);
  return {
    userId: user.id,
    globalRole: member.globalRole,
    buildings: member.buildings,
    units: user.userUnits.flatMap(link => {
      if (link.relationType !== 'OWNER' && link.relationType !== 'ROOMER')
        return [];
      return [
        {
          id: link.unitId,
          buildingId: link.unit.buildingId,
          relationType: link.relationType,
        },
      ];
    }),
  };
}

export async function loadClaimActor(userId: string): Promise<ClaimActor> {
  const user = await findUserById(userId);
  if (!user || !user.isActive) throw new ClaimError('USER_NOT_FOUND', 404);
  return toClaimActor(user);
}

function presentClaim(row: ClaimRow, canManage: boolean): PresentedClaim {
  return {
    id: row.id,
    buildingId: row.buildingId,
    unitId: row.unitId,
    unitName: row.unit?.name ?? null,
    buildingAmenityId: row.buildingAmenityId,
    amenityName: row.buildingAmenity?.amenity.name ?? null,
    title: row.title,
    body: row.body,
    status: row.status,
    author: row.author,
    reply: row.reply,
    repliedAt: row.repliedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    canManage,
  };
}

function presentDraft(row: ClaimDraft): PresentedClaimDraft {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    unitName: row.unitName,
    amenityName: row.amenityName,
    buildingName: row.buildingName,
    nextStatus: row.nextStatus,
    reply: row.reply,
  };
}

async function openBuilding(buildingId: string) {
  return prisma.building.findFirst({
    where: {id: buildingId, deleted: false, active: true},
    select: {id: true, name: true},
  });
}

export async function listClaimsForActor(
  actor: ClaimActor,
  buildingId: string,
  filter: {unitId?: string; buildingAmenityId?: string} = {},
) {
  const scope = claimListScope(actor, buildingId, filter);
  if (!scope.ok) throw new ClaimError(scope.error, 403);

  const building = await openBuilding(buildingId);
  if (!building) throw new ClaimError('BUILDING_NOT_FOUND', 404);

  if (filter.unitId) {
    const unit = await prisma.unit.findFirst({
      where: {id: filter.unitId, buildingId},
      select: {id: true},
    });
    if (!unit) throw new ClaimError('UNIT_NOT_FOUND', 404);
  }
  if (filter.buildingAmenityId) {
    const amenity = await prisma.buildingAmenity.findFirst({
      where: {id: filter.buildingAmenityId, buildingId},
      select: {id: true},
    });
    if (!amenity) throw new ClaimError('AMENITY_NOT_FOUND', 404);
  }

  const rows = await prisma.claim.findMany({
    where: claimWhere(buildingId, scope),
    include: claimInclude,
    orderBy: {createdAt: 'desc'},
  });
  const canManage = canManageClaim(actor, buildingId);
  return {
    canCreate: scope.canCreate,
    canCreateAmenity: scope.canCreateAmenity,
    canManage,
    claims: rows.map(row => presentClaim(row, canManage)),
  };
}

function claimWhere(
  buildingId: string,
  scope: Extract<ClaimListScope, {ok: true}>,
) {
  if (scope.buildingAmenityId) {
    return {buildingId, buildingAmenityId: scope.buildingAmenityId};
  }
  if (scope.unitIds === null) {
    return scope.includeAmenityClaims
      ? {buildingId}
      : {buildingId, buildingAmenityId: null};
  }
  if (!scope.includeAmenityClaims) {
    return {buildingId, unitId: {in: scope.unitIds}};
  }
  return {
    buildingId,
    OR: [
      ...(scope.unitIds.length > 0 ? [{unitId: {in: scope.unitIds}}] : []),
      {buildingAmenityId: {not: null}},
    ],
  };
}

export async function createClaimForActor(
  actor: ClaimActor,
  input: {
    title?: unknown;
    body?: unknown;
    unitId?: unknown;
    buildingAmenityId?: unknown;
  },
  expectedBuildingId?: string,
) {
  const text = parseClaimCreate(input);
  const target = parseClaimTarget(input);
  if (text === 'INVALID_CLAIM' || target === 'INVALID_CLAIM') {
    throw new ClaimError('INVALID_CLAIM');
  }

  if (target.kind === 'unit') {
    const unit = await prisma.unit.findUnique({
      where: {id: target.unitId},
      select: {id: true, buildingId: true, name: true},
    });
    if (
      !unit ||
      (expectedBuildingId && unit.buildingId !== expectedBuildingId)
    ) {
      throw new ClaimError('UNIT_NOT_FOUND', 404);
    }
    const building = await openBuilding(unit.buildingId);
    if (!building) throw new ClaimError('BUILDING_NOT_FOUND', 404);
    const access = claimCreateAccess(actor, unit);
    if (access !== 'OK') throw new ClaimError(access, 403);

    const row = await prisma.claim.create({
      data: {
        buildingId: unit.buildingId,
        unitId: unit.id,
        authorUserId: actor.userId,
        title: text.title,
        body: text.body,
      },
      include: claimInclude,
    });
    return presentClaim(row, false);
  }

  const amenity = await prisma.buildingAmenity.findFirst({
    where: {
      id: target.buildingAmenityId,
      isEnabled: true,
      ...(expectedBuildingId ? {buildingId: expectedBuildingId} : {}),
    },
    select: {id: true, buildingId: true},
  });
  if (!amenity) throw new ClaimError('AMENITY_NOT_FOUND', 404);
  const building = await openBuilding(amenity.buildingId);
  if (!building) throw new ClaimError('BUILDING_NOT_FOUND', 404);
  const access = claimAmenityAccess(actor, amenity.buildingId);
  if (access !== 'OK') throw new ClaimError(access, 403);

  const row = await prisma.claim.create({
    data: {
      buildingId: amenity.buildingId,
      buildingAmenityId: amenity.id,
      authorUserId: actor.userId,
      title: text.title,
      body: text.body,
    },
    include: claimInclude,
  });
  return presentClaim(row, false);
}

export async function updateClaimForActor(
  actor: ClaimActor,
  claimId: string,
  input: {status?: unknown; reply?: unknown},
) {
  const existing = await prisma.claim.findUnique({
    where: {id: claimId},
    select: {id: true, buildingId: true},
  });
  if (!existing) throw new ClaimError('CLAIM_NOT_FOUND', 404);
  if (!canManageClaim(actor, existing.buildingId)) {
    throw new ClaimError('INSUFFICIENT_PERMISSIONS', 403);
  }

  const update = parseClaimUpdate(input);
  if (update === 'INVALID_CLAIM') throw new ClaimError('INVALID_CLAIM');

  const row = await prisma.claim.update({
    where: {id: existing.id},
    data: claimUpdateData(actor.userId, update),
    include: claimInclude,
  });
  return presentClaim(row, true);
}

function claimUpdateData(userId: string, update: ClaimUpdateInput) {
  return {
    ...(update.status ? {status: update.status as ClaimStatus} : {}),
    ...(update.reply !== undefined
      ? {
          reply: update.reply,
          repliedAt: update.reply ? new Date() : null,
          repliedByUserId: update.reply ? userId : null,
        }
      : {}),
  };
}

async function unitInBuilding(unitId: string, buildingId: string) {
  return prisma.unit.findFirst({
    where: {id: unitId, buildingId},
    select: {id: true, name: true, buildingId: true},
  });
}

async function enabledAmenities(buildingId: string) {
  return prisma.buildingAmenity.findMany({
    where: {buildingId, isEnabled: true},
    select: {
      id: true,
      amenity: {select: {name: true, key: true}},
    },
    orderBy: {amenity: {name: 'asc'}},
  });
}

function matchAmenities(
  rows: {id: string; amenity: {name: string; key: string | null}}[],
  query: string,
) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return rows.filter(row => {
    const name = row.amenity.name.toLowerCase();
    const key = (row.amenity.key ?? '').toLowerCase();
    if (name.includes(q) || q.includes(name)) return true;
    return Boolean(key) && (key === q || q.includes(key));
  });
}

export async function draftClaimForActor(
  actor: ClaimActor,
  threadId: string,
  input: {
    buildingId: string;
    unitId?: string | undefined;
    buildingAmenityId?: string | undefined;
    amenityQuery?: string | undefined;
    title?: unknown;
    body?: unknown;
  },
) {
  const parsed = parseClaimCreate({title: input.title, body: input.body});
  if (parsed === 'INVALID_CLAIM') return {error: 'INVALID_CLAIM' as const};
  const target = parseClaimTarget({
    unitId: input.unitId,
    buildingAmenityId: input.buildingAmenityId,
  });
  if (input.unitId && input.buildingAmenityId)
    return {error: 'INVALID_CLAIM' as const};
  if (input.unitId && input.amenityQuery)
    return {error: 'INVALID_CLAIM' as const};
  if (target === 'INVALID_CLAIM' && (input.unitId || input.buildingAmenityId)) {
    return {error: 'INVALID_CLAIM' as const};
  }

  const building = await openBuilding(input.buildingId);
  if (!building) {
    const scope = claimListScope(actor, input.buildingId);
    if (!scope.ok) return {error: scope.error};
    return {error: 'BUILDING_NOT_FOUND' as const};
  }

  const amenityQuery = input.amenityQuery?.trim();
  if (
    (target !== 'INVALID_CLAIM' && target.kind === 'amenity') ||
    amenityQuery
  ) {
    const rows = await enabledAmenities(building.id);
    const chosen =
      target !== 'INVALID_CLAIM' && target.kind === 'amenity'
        ? rows.filter(row => row.id === target.buildingAmenityId)
        : matchAmenities(rows, amenityQuery ?? '');
    if (chosen.length === 0) return {error: 'AMENITY_NOT_FOUND' as const};
    if (chosen.length > 1) {
      return {
        error: 'AMENITY_AMBIGUOUS' as const,
        amenities: chosen.map(row => ({id: row.id, name: row.amenity.name})),
      };
    }
    const amenity = chosen[0];
    if (!amenity) return {error: 'AMENITY_NOT_FOUND' as const};
    const access = claimAmenityAccess(actor, building.id);
    if (access !== 'OK') return {error: access};

    const draft = await prisma.claimDraft.create({
      data: {
        threadId,
        userId: actor.userId,
        kind: 'CREATE',
        buildingId: building.id,
        buildingAmenityId: amenity.id,
        title: parsed.title,
        body: parsed.body,
        unitName: '',
        amenityName: amenity.amenity.name,
        buildingName: building.name,
      },
    });
    return {needsConfirmation: true as const, ...presentDraft(draft)};
  }

  let unitId =
    target !== 'INVALID_CLAIM' && target.kind === 'unit'
      ? target.unitId
      : undefined;
  if (!unitId) {
    const own = residentUnitIds(actor, building.id);
    const canAmenity = claimAmenityAccess(actor, building.id) === 'OK';
    const amenities = canAmenity ? await enabledAmenities(building.id) : [];
    if (canAmenity && amenities.length > 0) {
      const units =
        own.length === 0
          ? []
          : await prisma.unit.findMany({
              where: {id: {in: own}},
              select: {id: true, name: true},
              orderBy: {name: 'asc'},
            });
      return {
        error: 'TARGET_AMBIGUOUS' as const,
        units,
        amenities: amenities.map(row => ({id: row.id, name: row.amenity.name})),
      };
    }
    if (own.length === 0) return {error: 'INSUFFICIENT_PERMISSIONS' as const};
    if (own.length > 1) {
      const units = await prisma.unit.findMany({
        where: {id: {in: own}},
        select: {id: true, name: true},
        orderBy: {name: 'asc'},
      });
      return {error: 'UNIT_AMBIGUOUS' as const, units};
    }
    unitId = own[0];
  }
  if (!unitId) return {error: 'UNIT_NOT_FOUND' as const};

  const unit = await unitInBuilding(unitId, building.id);
  if (!unit) return {error: 'UNIT_NOT_FOUND' as const};
  const access = claimCreateAccess(actor, unit);
  if (access !== 'OK') return {error: access};

  const draft = await prisma.claimDraft.create({
    data: {
      threadId,
      userId: actor.userId,
      kind: 'CREATE',
      buildingId: building.id,
      unitId: unit.id,
      title: parsed.title,
      body: parsed.body,
      unitName: unit.name,
      buildingName: building.name,
    },
  });
  return {needsConfirmation: true as const, ...presentDraft(draft)};
}

export async function draftClaimResolutionForActor(
  actor: ClaimActor,
  threadId: string,
  input: {claimId: string; status?: unknown; reply?: unknown},
) {
  const existing = await prisma.claim.findUnique({
    where: {id: input.claimId},
    include: {
      unit: {select: {name: true}},
      buildingAmenity: {select: {amenity: {select: {name: true}}}},
      building: {select: {id: true, name: true, active: true, deleted: true}},
    },
  });
  if (!existing || !existing.building.active || existing.building.deleted) {
    if (!existing) return {error: 'CLAIM_NOT_FOUND' as const};
    return {error: 'BUILDING_NOT_FOUND' as const};
  }
  if (!canManageClaim(actor, existing.buildingId)) {
    return {error: 'INSUFFICIENT_PERMISSIONS' as const};
  }

  const update = parseClaimUpdate(input);
  if (update === 'INVALID_CLAIM') return {error: 'INVALID_CLAIM' as const};

  const draft = await prisma.claimDraft.create({
    data: {
      threadId,
      userId: actor.userId,
      kind: 'RESOLVE',
      buildingId: existing.buildingId,
      claimId: existing.id,
      title: existing.title,
      ...(update.status ? {nextStatus: update.status} : {}),
      ...(update.reply !== undefined
        ? {reply: update.reply, replyProvided: true}
        : {}),
      unitName: existing.unit?.name ?? '',
      ...(existing.buildingAmenity
        ? {amenityName: existing.buildingAmenity.amenity.name}
        : {}),
      buildingName: existing.building.name,
    },
  });
  return {needsConfirmation: true as const, ...presentDraft(draft)};
}

export async function describeClaimDraftConfirmation(
  actor: ClaimActor,
  draftId: string,
) {
  const draft = await prisma.claimDraft.findFirst({
    where: {
      id: draftId,
      userId: actor.userId,
      status: ClaimDraftStatus.PENDING,
    },
  });
  if (!draft) return {error: 'DRAFT_NOT_FOUND' as const};
  return {error: 'CONFIRMATION_REQUIRED' as const, ...presentDraft(draft)};
}

export async function expireStaleClaimDrafts(threadId: string) {
  await prisma.claimDraft.updateMany({
    where: {
      threadId,
      status: ClaimDraftStatus.PENDING,
      createdAt: {lt: new Date(Date.now() - DRAFT_TTL_MS)},
    },
    data: {status: ClaimDraftStatus.EXPIRED},
  });
}

export async function pendingClaimDrafts(threadId: string, userId: string) {
  await expireStaleClaimDrafts(threadId);
  const drafts = await prisma.claimDraft.findMany({
    where: {threadId, userId, status: ClaimDraftStatus.PENDING},
    orderBy: {createdAt: 'desc'},
  });
  return drafts.map(presentDraft);
}

export async function confirmClaimDraftForActor(
  actor: ClaimActor,
  draftId: string,
) {
  const draft = await prisma.claimDraft.findFirst({
    where: {id: draftId, userId: actor.userId},
  });
  if (!draft) throw new ClaimError('DRAFT_NOT_FOUND', 404);
  if (draft.status !== ClaimDraftStatus.PENDING) {
    throw new ClaimError('DRAFT_NOT_PENDING', 409);
  }
  if (draft.createdAt.getTime() < Date.now() - DRAFT_TTL_MS) {
    await prisma.claimDraft.update({
      where: {id: draft.id},
      data: {status: ClaimDraftStatus.EXPIRED},
    });
    throw new ClaimError('DRAFT_EXPIRED', 409);
  }

  const access = claimDraftConfirmAccess(actor, {
    userId: draft.userId,
    kind: draft.kind,
    buildingId: draft.buildingId,
    unitId: draft.unitId,
    buildingAmenityId: draft.buildingAmenityId,
  });
  if (access !== 'OK') {
    throw new ClaimError(access, access === 'DRAFT_NOT_FOUND' ? 404 : 403);
  }

  const claim =
    draft.kind === 'CREATE'
      ? await createClaimForActor(actor, {
          title: draft.title,
          body: draft.body ?? '',
          ...(draft.buildingAmenityId
            ? {buildingAmenityId: draft.buildingAmenityId}
            : {unitId: draft.unitId ?? ''}),
        })
      : await updateClaimForActor(actor, draft.claimId ?? '', {
          ...(draft.nextStatus ? {status: draft.nextStatus} : {}),
          ...(draft.replyProvided ? {reply: draft.reply} : {}),
        });

  await prisma.claimDraft.update({
    where: {id: draft.id},
    data: {status: ClaimDraftStatus.CONFIRMED, resultClaimId: claim.id},
  });

  return {draft, claim};
}
