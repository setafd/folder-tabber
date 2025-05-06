import { create } from 'zustand';
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

export const useBookmarkStore = create<BookmarkState>()(
  devtools(
    persist(
      (set) => ({
        folders: [],
        fetchFolders: async () => {
          const bookmarksTree = await getBookmarksTree();
          const folders = bookmarksTree
            ?.filter((item) => item.children)
            .flatMap((item) => item.children ?? [])
            .map((item, index) => ({
              index,
              id: item.id,
              title: item.title,
            }));

          set({ folders });
        },
        selectedFolderId: null,
        setSelectedFolderId: async (id) => {
          set({ selectedFolderId: id });
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

          if (mappedSubTree[0].children?.length === 0) {
            mappedSubTree.shift();
          }

          set({ folderChildrens: mappedSubTree });
        },
        folderChildrens: [],
      }),
      persistOptions,
    ),
    devtoolsOptions,
  ),
);
