import { create } from 'zustand';

interface UiState {
  selectedDiscoveryId: number | null;
  selectedMonitorId: number | null;
  setSelectedDiscoveryId: (id: number | null) => void;
  setSelectedMonitorId: (id: number | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  selectedDiscoveryId: null,
  selectedMonitorId: null,
  setSelectedDiscoveryId: (id) => set({ selectedDiscoveryId: id }),
  setSelectedMonitorId: (id) => set({ selectedMonitorId: id }),
}));
