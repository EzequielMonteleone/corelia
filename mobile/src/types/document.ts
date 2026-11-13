export type DocumentKind = 'BYLAW' | 'NOTICE';

export type BuildingDocumentSummary = {
  id: string;
  title: string;
  kind: DocumentKind;
  createdAt: string;
};

export type BuildingDocumentList = {
  canManage: boolean;
  documents: BuildingDocumentSummary[];
};

export type BuildingDocumentDetail = BuildingDocumentSummary & {
  buildingId: string;
  body: string;
  canManage: boolean;
};
