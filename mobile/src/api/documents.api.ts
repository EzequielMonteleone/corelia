import {apiClient} from '@/api/client';
import type {
  BuildingDocumentDetail,
  BuildingDocumentList,
  DocumentKind,
} from '@/types/document';

export async function listDocuments(
  buildingId: string,
): Promise<BuildingDocumentList> {
  const {data} = await apiClient.get<BuildingDocumentList>(
    `/buildings/${buildingId}/documents`,
  );
  return data;
}

export async function getDocument(
  buildingId: string,
  documentId: string,
): Promise<BuildingDocumentDetail> {
  const {data} = await apiClient.get<BuildingDocumentDetail>(
    `/buildings/${buildingId}/documents/${documentId}`,
  );
  return data;
}

export async function createDocument(input: {
  buildingId: string;
  title: string;
  body: string;
  kind: DocumentKind;
}): Promise<{id: string}> {
  const {buildingId, ...body} = input;
  const {data} = await apiClient.post<{id: string}>(
    `/buildings/${buildingId}/documents`,
    body,
  );
  return data;
}
