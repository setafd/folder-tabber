import { createStore } from 'zustand';
import { type PersistOptions, createJSONStorage, persist } from 'zustand/middleware';
import { syncTabs } from 'zustand-sync-tabs';

import { IS_DEV } from '@shared/config';

import { getBookmarksTree, getSubTree } from './bookmark.api';
import { DEFAULT_FOLDER_ID } from './bookmark.const';

type Folder = {
  id: string;
  title: string;
  index: number;
};

interface TopLevelFolder {
  id: string;
  title: string;
  children: Folder[];
}

export type FolderChildren = chrome.bookmarks.BookmarkTreeNode;

interface BookmarkState {
  folders: TopLevelFolder[];
  fetchFolders: () => Promise<void>;
  selectedFolder: {
    id: string;
    title: string;
  } | null;
  setSelectedFolder: (folder: { id: string; title: string } | null) => Promise<void>;
  fetchFolderChildrens: () => void;
  folderChildrens: FolderChildren[];
  rootParentsIds: string[];
}

type PersistedBookmarkState = Pick<BookmarkState, 'folders' | 'selectedFolder' | 'folderChildrens'>;

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
        setItem: async (name: string, value: string): Promise<void> =>
          await chrome.storage.local.set({ [name]: value }),
        removeItem: async (name: string): Promise<void> => chrome.storage.local.remove([name]),
      })),
  partialize: (state) => ({
    folders: state.folders,
    selectedFolder: state.selectedFolder,
    folderChildrens: state.folderChildrens,
  }),
};

export const bookmarkStore = createStore<BookmarkState>()(
  persist(
    syncTabs(
      (set, get) => ({
        folders: [],
        fetchFolders: async () => {
          const bookmarksTree = await getBookmarksTree();

          const folders =
            bookmarksTree.map((folder) => {
              return {
                id: folder.id,
                title: folder.title,
                children:
                  folder.children?.map((child) => ({ id: child.id, title: child.title, index: child.index! })) ?? [],
              };
            }) ?? [];

          set({ folders });

          // set first folder as selected if there's no selected folder
          if (!get().selectedFolder && folders.length && folders[0].children.length) {
            const { id, title } = folders[0].children[0];
            get().setSelectedFolder({id, title});
          }
        },
        selectedFolder: null,
        setSelectedFolder: async (folder) => {
          if (!folder) {
            set({ selectedFolder: null });
            return;
          }
          set({ selectedFolder: folder });
        },
        fetchFolderChildrens: async () => {
          const [folder] = await getSubTree(bookmarkStore.getState().selectedFolder?.id ?? '');

          const children = folder.children || [];
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
            [{ id: DEFAULT_FOLDER_ID, children: [], syncing: false, title: 'Default' }],
          );

          set({ folderChildrens: mappedSubTree });
        },
        folderChildrens: [],
        rootParentsIds: [],
      }),
      { name: 'bookmark-channel' },
    ),
    persistOptions,
  ),
);
