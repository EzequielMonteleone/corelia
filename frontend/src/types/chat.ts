export type ChatMessage = {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  choices?: string[];
};

export type PendingDraft = {
  id: string;
  amenityName: string;
  unitName: string;
  buildingName: string;
  startsAt: string;
  notes: string | null;
};

export type PendingClaimDraft = {
  id: string;
  kind: 'CREATE' | 'RESOLVE';
  title: string;
  body: string | null;
  unitName: string;
  amenityName: string | null;
  buildingName: string;
  nextStatus: 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | null;
  reply: string | null;
};

export type ChatThread = {
  threadId: string | null;
  messages: ChatMessage[];
  pendingDrafts: PendingDraft[];
  pendingClaimDrafts: PendingClaimDraft[];
};
