import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import apiClient from '@/lib/apiClient';
import {
  BuildingDocumentDetail,
  BuildingDocumentList,
  DocumentKind,
} from '@/types/document';

export function useDocuments(buildingId: string | null) {
  return useQuery<BuildingDocumentList>({
    queryKey: ['documents', buildingId],
    queryFn: async () => {
      const res = await apiClient.get(`/buildings/${buildingId}/documents`);
      return res.data;
    },
    enabled: !!buildingId,
  });
}

export function useDocument(
  buildingId: string | null,
  documentId: string | null,
) {
  return useQuery<BuildingDocumentDetail>({
    queryKey: ['document', buildingId, documentId],
    queryFn: async () => {
      const res = await apiClient.get(
        `/buildings/${buildingId}/documents/${documentId}`,
      );
      return res.data;
    },
    enabled: !!buildingId && !!documentId,
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      buildingId: string;
      title: string;
      body: string;
      kind: DocumentKind;
    }) => {
      const {buildingId, ...body} = input;
      const res = await apiClient.post(
        `/buildings/${buildingId}/documents`,
        body,
      );
      return res.data as {id: string};
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['documents', variables.buildingId],
      });
      queryClient.invalidateQueries({queryKey: ['notifications']});
    },
  });
}
