import { create } from 'zustand';

type SidebarState = {
  isReorderMode: boolean;
  toggleReorderMode: () => void;
  setReorderMode: (v: boolean) => void;
};

export const useSidebarState = create<SidebarState>((set) => ({
  isReorderMode: false,
  toggleReorderMode: () =>
    set((s) => ({ isReorderMode: !s.isReorderMode })),
  setReorderMode: (v) => set({ isReorderMode: v }),
}));
