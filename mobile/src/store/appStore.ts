import {create} from 'zustand';

type AppState = {
  selectedBuildingId: string | null;
  setSelectedBuildingId: (id: string | null) => void;
  selectedUnitId: string | null;
  setSelectedUnitId: (id: string | null) => void;
};

export const useAppStore = create<AppState>(set => ({
  selectedBuildingId: null,
  setSelectedBuildingId: id => set({selectedBuildingId: id}),
  selectedUnitId: null,
  setSelectedUnitId: id => set({selectedUnitId: id}),
}));
