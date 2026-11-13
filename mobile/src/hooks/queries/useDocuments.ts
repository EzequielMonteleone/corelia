import {createDocument, getDocument, listDocuments} from '@/api/documents.api';
import {queryKeys} from '@/api/queryKeys';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

export function useDocuments(buildingId: string | null) {
  return useQuery({
    queryKey: queryKeys.documents(buildingId),
    queryFn: () => listDocuments(buildingId as string),
    enabled: !!buildingId,
  });
}

export function useDocument(
  buildingId: string | null,
  documentId: string | null,
) {
  return useQuery({
    queryKey: queryKeys.document(buildingId, documentId),
    queryFn: () => getDocument(buildingId as string, documentId as string),
    enabled: !!buildingId && !!documentId,
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDocument,
    onSuccess: (_result, input) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.documents(input.buildingId),
      });
      queryClient.invalidateQueries({queryKey: queryKeys.notifications});
    },
  });
}
