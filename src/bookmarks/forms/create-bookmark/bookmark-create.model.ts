import { create } from 'zustand';

type State = {
  open: boolean;
  parentId?: string;
  option?: 'bookmark' | 'folder';
};

type Action = {
  setOpen: (parentId: string, option?: 'bookmark' | 'folder') => void;
  onClose: () => void;
};

type Model = State & Action;

const initialState: State = {
  open: false,
};

export const useCreateBookmarkState = create<Model>((set) => ({
  ...initialState,
  setOpen: (parentId: string, option?: 'bookmark' | 'folder') => set({ open: true, parentId, option }),
  onClose: () => set(initialState),
}));
