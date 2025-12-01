import { create } from 'zustand';

type State = {
  open: boolean;
  id?: string;
  title?: string;
  url?: string;
  option?: 'bookmark' | 'folder';
};

type Action = {
  setOpen: (id: string, title: string, url?: string, option?: 'bookmark' | 'folder') => void;
  onClose: () => void;
};

type Model = State & Action;

const initialState: State = {
  open: false,
};

export const useEditBookmarkState = create<Model>((set) => ({
  ...initialState,
  setOpen: (id: string, title: string, url?: string, option?: 'bookmark' | 'folder') =>
    set({ open: true, id, title, url, option }),
  onClose: () => set(initialState),
}));
