import { create } from 'zustand';

interface SelectionState {
  projectId: string | null;
  setProjectId: (projectId: string | null) => void;
}

export const useSelection = create<SelectionState>((set) => ({
  projectId: null,
  setProjectId: (projectId) => set({ projectId }),
}));