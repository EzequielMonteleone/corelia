import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import apiClient from '@/lib/apiClient';
import {
  Household,
  HouseholdMember,
  HouseholdMemberInput,
  Pet,
  PetInput,
  Vehicle,
  VehicleInput,
} from '@/types/household';

export function useHousehold(unitId: string | null) {
  return useQuery<Household>({
    queryKey: ['household', unitId],
    queryFn: async () => {
      const res = await apiClient.get(`/units/${unitId}/household`);
      return res.data;
    },
    enabled: !!unitId,
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {unitId: string} & HouseholdMemberInput) => {
      const {unitId, ...body} = input;
      const res = await apiClient.post(`/units/${unitId}/members`, body);
      return res.data as HouseholdMember;
    },
    onSuccess: row => {
      queryClient.invalidateQueries({queryKey: ['household', row.unitId]});
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {id: string} & HouseholdMemberInput) => {
      const {id, ...body} = input;
      const res = await apiClient.put(`/members/${id}`, body);
      return res.data as HouseholdMember;
    },
    onSuccess: row => {
      queryClient.invalidateQueries({queryKey: ['household', row.unitId]});
    },
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {id: string; unitId: string}) => {
      await apiClient.delete(`/members/${input.id}`);
      return input.unitId;
    },
    onSuccess: unitId => {
      queryClient.invalidateQueries({queryKey: ['household', unitId]});
    },
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {unitId: string} & VehicleInput) => {
      const {unitId, ...body} = input;
      const res = await apiClient.post(`/units/${unitId}/vehicles`, body);
      return res.data as Vehicle;
    },
    onSuccess: row => {
      queryClient.invalidateQueries({queryKey: ['household', row.unitId]});
    },
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {id: string} & VehicleInput) => {
      const {id, ...body} = input;
      const res = await apiClient.put(`/vehicles/${id}`, body);
      return res.data as Vehicle;
    },
    onSuccess: row => {
      queryClient.invalidateQueries({queryKey: ['household', row.unitId]});
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {id: string; unitId: string}) => {
      await apiClient.delete(`/vehicles/${input.id}`);
      return input.unitId;
    },
    onSuccess: unitId => {
      queryClient.invalidateQueries({queryKey: ['household', unitId]});
    },
  });
}

export function useCreatePet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {unitId: string} & PetInput) => {
      const {unitId, ...body} = input;
      const res = await apiClient.post(`/units/${unitId}/pets`, body);
      return res.data as Pet;
    },
    onSuccess: row => {
      queryClient.invalidateQueries({queryKey: ['household', row.unitId]});
    },
  });
}

export function useUpdatePet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {id: string} & PetInput) => {
      const {id, ...body} = input;
      const res = await apiClient.put(`/pets/${id}`, body);
      return res.data as Pet;
    },
    onSuccess: row => {
      queryClient.invalidateQueries({queryKey: ['household', row.unitId]});
    },
  });
}

export function useDeletePet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {id: string; unitId: string}) => {
      await apiClient.delete(`/pets/${input.id}`);
      return input.unitId;
    },
    onSuccess: unitId => {
      queryClient.invalidateQueries({queryKey: ['household', unitId]});
    },
  });
}
