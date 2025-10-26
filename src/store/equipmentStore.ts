import { create } from 'zustand';
import { Equipment, EquipmentStatus } from '@/types/equipment';
import { apiService } from '@/services/apiService';

interface EquipmentState {
  equipment: Map<string, Equipment>;
  loading: boolean;
  error: string | null;
  selectedEquipmentId: string | null;

  // Actions
  fetchAllEquipment: () => Promise<void>;
  fetchEquipment: (id: string) => Promise<void>;
  updateEquipmentStatus: (id: string, status: EquipmentStatus) => void;
  updateEquipmentParameter: (id: string, parameter: string, value: unknown) => void;
  selectEquipment: (id: string | null) => void;
  getEquipment: (id: string) => Equipment | undefined;
  getAllEquipment: () => Equipment[];
}

export const useEquipmentStore = create<EquipmentState>((set, get) => ({
  equipment: new Map(),
  loading: false,
  error: null,
  selectedEquipmentId: null,

  fetchAllEquipment: async () => {
    set({ loading: true, error: null });
    try {
      const equipmentList = await apiService.getAllEquipment();
      const equipmentMap = new Map(equipmentList.map(eq => [eq.id, eq]));
      set({ equipment: equipmentMap, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchEquipment: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const equipment = await apiService.getEquipment(id);
      set(state => {
        const newMap = new Map(state.equipment);
        newMap.set(id, equipment);
        return { equipment: newMap, loading: false };
      });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  updateEquipmentStatus: (id: string, status: EquipmentStatus) => {
    set(state => {
      const equipment = state.equipment.get(id);
      if (!equipment) return state;

      const updated = { ...equipment, status, lastUpdate: new Date() };
      const newMap = new Map(state.equipment);
      newMap.set(id, updated);
      return { equipment: newMap };
    });
  },

  updateEquipmentParameter: (id: string, parameter: string, value: unknown) => {
    set(state => {
      const equipment = state.equipment.get(id);
      if (!equipment) return state;

      const updated: Equipment = {
        ...equipment,
        parameters: { ...equipment.parameters, [parameter]: value as string | number | boolean | undefined },
        lastUpdate: new Date(),
      };
      const newMap = new Map(state.equipment);
      newMap.set(id, updated);
      return { equipment: newMap };
    });
  },

  selectEquipment: (id: string | null) => {
    set({ selectedEquipmentId: id });
  },

  getEquipment: (id: string) => {
    return get().equipment.get(id);
  },

  getAllEquipment: () => {
    return Array.from(get().equipment.values());
  },
}));
