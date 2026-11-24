import { create } from 'zustand';

type State = {
  isOpenConfirmFor: string | null;
};

type Action = {
  toggleOpenConfirm: (isOpenConfirmFor: string | null) => void;
};

type Model = State & Action;

const initialState: State = {
  isOpenConfirmFor: null,
};

export const useDeleteFolderState = create<Model>((set) => ({
  ...initialState,
  toggleOpenConfirm: (isOpenConfirmFor) => set({ isOpenConfirmFor }),
}));
