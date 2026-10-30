export const CLAIM_STATUSES = ['OPEN', 'IN_PROGRESS', 'CLOSED'] as const;

export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export type ClaimAuthor = {
  id: string;
  firstName: string;
  lastName: string;
};

export type Claim = {
  id: string;
  buildingId: string;
  unitId: string | null;
  unitName: string | null;
  buildingAmenityId: string | null;
  amenityName: string | null;
  title: string;
  body: string;
  status: ClaimStatus;
  author: ClaimAuthor;
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
  canManage: boolean;
};

export type ClaimList = {
  canCreate: boolean;
  canCreateAmenity: boolean;
  canManage: boolean;
  claims: Claim[];
};

export type ClaimCreateInput = {
  title: string;
  body: string;
};

export type ClaimUpdateInput = {
  status?: ClaimStatus;
  reply?: string | null;
};
