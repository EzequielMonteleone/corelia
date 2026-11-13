import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
  createMember,
  createPet,
  createVehicle,
  deleteMember,
  deletePet,
  deleteVehicle,
  getHousehold,
  updateMember,
  updatePet,
  updateVehicle,
} from '@/api/household.api';
import {queryKeys} from '@/api/queryKeys';

export function useHousehold(unitId: string | null) {
  return useQuery({
    queryKey: queryKeys.household(unitId),
    queryFn: () => getHousehold(unitId as string),
    enabled: !!unitId,
  });
}

function invalidateHousehold(
  queryClient: ReturnType<typeof useQueryClient>,
  unitId: string,
) {
  queryClient.invalidateQueries({queryKey: queryKeys.household(unitId)});
}

export function useCreateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMember,
    onSuccess: row => invalidateHousehold(queryClient, row.unitId),
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMember,
    onSuccess: row => invalidateHousehold(queryClient, row.unitId),
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {id: string; unitId: string}) =>
      deleteMember(input.id),
    onSuccess: (_result, input) =>
      invalidateHousehold(queryClient, input.unitId),
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createVehicle,
    onSuccess: row => invalidateHousehold(queryClient, row.unitId),
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateVehicle,
    onSuccess: row => invalidateHousehold(queryClient, row.unitId),
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {id: string; unitId: string}) =>
      deleteVehicle(input.id),
    onSuccess: (_result, input) =>
      invalidateHousehold(queryClient, input.unitId),
  });
}

export function useCreatePet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPet,
    onSuccess: row => invalidateHousehold(queryClient, row.unitId),
  });
}

export function useUpdatePet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePet,
    onSuccess: row => invalidateHousehold(queryClient, row.unitId),
  });
}

export function useDeletePet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {id: string; unitId: string}) => deletePet(input.id),
    onSuccess: (_result, input) =>
      invalidateHousehold(queryClient, input.unitId),
  });
}
