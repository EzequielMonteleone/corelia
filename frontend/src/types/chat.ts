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

export type ChatThread = {
  threadId: string | null;
  messages: ChatMessage[];
  pendingDrafts: PendingDraft[];
};
