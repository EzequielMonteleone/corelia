import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
  createBuilding,
  createBuildingAmenity,
  createUnit,
  deleteBuilding,
  deleteBuildingAmenity,
  deleteUnit,
  getBuilding,
  getBuildingAmenities,
  listBuildingUnits,
  listBuildings,
  updateBuilding,
  updateBuildingAmenity,
  updateUnit,
} from '@/api/buildings.api';
import {queryKeys} from '@/api/queryKeys';

export function useBuildings() {
  return useQuery({
    queryKey: queryKeys.buildings,
    queryFn: listBuildings,
  });
}

export function useBuilding(id: string | null) {
  return useQuery({
    queryKey: queryKeys.building(id),
    queryFn: () => getBuilding(id as string),
    enabled: !!id,
  });
}

export function useCreateBuilding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBuilding,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: queryKeys.buildings});
    },
  });
}

export function useUpdateBuilding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {id: string} & Parameters<typeof updateBuilding>[1]) => {
      const {id, ...values} = input;
      return updateBuilding(id, values);
    },
    onSuccess: (_building, input) => {
      queryClient.invalidateQueries({queryKey: queryKeys.buildings});
      queryClient.invalidateQueries({queryKey: queryKeys.building(input.id)});
    },
  });
}

export function useDeleteBuilding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBuilding,
    onSuccess: (_result, id) => {
      queryClient.removeQueries({queryKey: queryKeys.building(id)});
      queryClient.invalidateQueries({queryKey: queryKeys.buildings});
    },
  });
}

export function useBuildingUnits(buildingId: string | null) {
  return useQuery({
    queryKey: queryKeys.buildingUnits(buildingId),
    queryFn: () => listBuildingUnits(buildingId as string),
    enabled: !!buildingId,
  });
}

export function useCreateUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUnit,
    onSuccess: (_unit, input) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.buildingUnits(input.buildingId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.building(input.buildingId),
      });
    },
  });
}

export function useUpdateUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUnit,
    onSuccess: unit => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.buildingUnits(unit.buildingId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.building(unit.buildingId),
      });
    },
  });
}

export function useDeleteUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUnit,
    onSuccess: (_result, input) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.buildingUnits(input.buildingId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.building(input.buildingId),
      });
    },
  });
}

export function useBuildingAmenities(buildingId: string | null) {
  return useQuery({
    queryKey: queryKeys.buildingAmenities(buildingId),
    queryFn: () => getBuildingAmenities(buildingId as string),
    enabled: !!buildingId,
  });
}

function invalidateAmenities(
  queryClient: ReturnType<typeof useQueryClient>,
  buildingId: string,
) {
  queryClient.invalidateQueries({
    queryKey: queryKeys.buildingAmenities(buildingId),
  });
  queryClient.invalidateQueries({
    queryKey: queryKeys.building(buildingId),
  });
  queryClient.invalidateQueries({queryKey: queryKeys.reservationsRoot});
}

export function useCreateBuildingAmenity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBuildingAmenity,
    onSuccess: (_amenity, input) => {
      invalidateAmenities(queryClient, input.buildingId);
    },
  });
}

export function useUpdateBuildingAmenity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBuildingAmenity,
    onSuccess: (_amenity, input) => {
      invalidateAmenities(queryClient, input.buildingId);
    },
  });
}

export function useDeleteBuildingAmenity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBuildingAmenity,
    onSuccess: (_result, input) => {
      invalidateAmenities(queryClient, input.buildingId);
    },
  });
}
