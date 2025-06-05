import { createStore, useStore } from 'zustand';
import { type DevtoolsOptions, type PersistOptions, createJSONStorage, devtools, persist } from 'zustand/middleware';

import { IS_DEV } from '@shared/config';

import { getBookmarksTree, getSubTree } from './bookmark.api';

interface TopLevelFolder {
  index: number;
  id: string;
  title: string;
}

export type FolderChildren = chrome.bookmarks.BookmarkTreeNode;

interface BookmarkState {
  folders: TopLevelFolder[];
  fetchFolders: () => void;
  selectedFolder: {
    id: string;
    title: string;
  } | null;
  setSelectedFolderId: (id: string) => void;
  folderChildrens: FolderChildren[];
  newFolderDestinationIds: string[];
}

type PersistedBookmarkState = Pick<BookmarkState, 'folders' | 'selectedFolder' | 'folderChildrens'>;

const devtoolsOptions: DevtoolsOptions = {
  name: 'bookmark-storage',
  enabled: IS_DEV,
};

const persistOptions: PersistOptions<BookmarkState, PersistedBookmarkState> = {
  name: 'bookmark-storage',
  version: 1,
  storage: IS_DEV
    ? createJSONStorage(() => localStorage)
    : createJSONStorage(() => ({
        getItem: async (name: string): Promise<string | null> => {
          const result = await chrome.storage.local.get([name]);
          return result[name] || null;
        },
        setItem: async (name: string, value: string): Promise<void> => {
          await chrome.storage.local.set({ [name]: value });
        },
        removeItem: async (name: string): Promise<void> => {
          await chrome.storage.local.remove([name]);
        },
      })),
  partialize: (state) => ({
    folders: state.folders,
    selectedFolder: state.selectedFolder,
    folderChildrens: state.folderChildrens,
  }),
  onRehydrateStorage: (state) => {
    return () => {
      if (state.selectedFolder) {
        state.setSelectedFolderId(state.selectedFolder?.id);
      }
    };
  },
};

export const bookmarkStore = createStore<BookmarkState>()(
  devtools(
    persist(
      (set, get) => ({
        folders: [],
        fetchFolders: async () => {
          const bookmarksTree = await getBookmarksTree();
          const folders = bookmarksTree
            .flatMap((topFolder) => topFolder.children ?? [])
            ?.filter((folder) => folder.children)
            .map((item, index) => ({
              index,
              id: item.id,
              title: item.title,
            }));

          set({ newFolderDestinationIds: bookmarksTree.map((item) => item.id) }, false, 'setNewFilderDestinationIds');

          // set first folder as selected if there is no selected folder
          if (!get().selectedFolder && folders.length) {
            get().setSelectedFolderId(folders[0].id);
          }

          set({ folders }, false, 'fetchFolders');
        },
        selectedFolder: null,
        setSelectedFolderId: async (id) => {
          const foundFolder = get().folders.find((folder) => folder.id === id);
          console.log(get().folders);
          if (!foundFolder) {
            console.error(`Can't find folder with id=${id}`);
            return;
          }

          set({ selectedFolder: { id, title: foundFolder.title } }, false, 'setSelectedFolder');
          const [folder] = await getSubTree(id);
          const children = folder.children || [];

          if (!children.length) {
            set({ folderChildrens: [] }, false, 'setFolderChildrens');
            return;
          }

          const mappedSubTree = children?.reduce<FolderChildren[]>(
            (acc, child) => {
              const isFolder = !!child.children;

              if (isFolder) {
                acc.push(child);
              } else {
                acc[0].children?.push(child);
              }

              return acc;
            },
            [{ id: '-1', children: [], syncing: false, title: 'Default' }],
          );

          set({ folderChildrens: mappedSubTree }, false, 'setFolderChildrens');
        },
        folderChildrens: [],
        newFolderDestinationIds: [],
      }),
      persistOptions,
    ),
    devtoolsOptions,
  ),
);

export const useBookmarkStore = () => useStore(bookmarkStore);
