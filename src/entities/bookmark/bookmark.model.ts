import { createStore, useStore } from 'zustand';
import { type DevtoolsOptions, type PersistOptions, devtools, persist } from 'zustand/middleware';

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
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string) => void;
  folderChildrens: FolderChildren[];
  newFolderDestinationIds: string[];
}

type PersistedBookmarkState = Pick<BookmarkState, 'folders' | 'selectedFolderId' | 'folderChildrens'>;

const devtoolsOptions: DevtoolsOptions = {
  name: 'BookmarkStore',
};

const persistOptions: PersistOptions<BookmarkState, PersistedBookmarkState> = {
  name: 'bookmark-storage',
  version: 1,
  partialize: (state) => ({
    folders: state.folders,
    selectedFolderId: state.selectedFolderId,
    folderChildrens: state.folderChildrens,
  }),
  onRehydrateStorage: (state) => {
    return () => {
      if (state.selectedFolderId) {
        state.setSelectedFolderId(state.selectedFolderId);
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

          set({ newFolderDestinationIds: bookmarksTree.map((item) => item.id) });

          // set first folder as selected if there is no selected folder
          if (!get().selectedFolderId && folders.length) {
            get().setSelectedFolderId(folders[0].id);
          }

          set({ folders }, false, 'fetchFolders');
        },
        selectedFolderId: null,
        setSelectedFolderId: async (id) => {
          set({ selectedFolderId: id }, false, 'setSelectedFolderId');
          const [folder] = await getSubTree(id);
          const children = folder.children || [];

          if (!children.length) {
            set({ folderChildrens: [] });
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
