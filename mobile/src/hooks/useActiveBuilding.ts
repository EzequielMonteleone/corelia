import {useEffect, useMemo} from 'react';
import {useBuildings} from '@/hooks/queries/useBuildings';
import {useAppStore} from '@/store/appStore';

/**
 * Resolves the building shared by all building-scoped screens.
 * A single-building user gets it automatically; multi-building users pick one.
 */
export function useActiveBuilding() {
  const selectedBuildingId = useAppStore(state => state.selectedBuildingId);
  const setSelectedBuildingId = useAppStore(
    state => state.setSelectedBuildingId,
  );
  const query = useBuildings();
  const buildings = useMemo(() => query.data ?? [], [query.data]);

  const activeBuilding =
    buildings.find(building => building.id === selectedBuildingId) ??
    (buildings.length === 1 ? buildings[0] : undefined);

  useEffect(() => {
    if (query.isLoading) return;
    if (
      selectedBuildingId &&
      !buildings.some(building => building.id === selectedBuildingId)
    ) {
      setSelectedBuildingId(null);
    }
  }, [buildings, query.isLoading, selectedBuildingId, setSelectedBuildingId]);

  return {
    ...query,
    buildings,
    activeBuilding,
    activeBuildingId: activeBuilding?.id ?? null,
    selectedBuildingId,
    setSelectedBuildingId,
  };
}
