import { createStore } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { syncTabs } from 'zustand-sync-tabs';

import { platform } from '@/platform';

import { getBookmarksTree, moveBookmark } from './bookmark.api';
import { bookmarkPath, findBookmark, isBookmark, isFolder } from './bookmark.lib';
import type { BookmarkNode } from './types';

export type FolderChildren = BookmarkNode;
export interface TopLevelFolder {
  id: string;
  title: string;
  children: { id: string; title: string; index: number }[];
}
type Selection = { id: string; title: string } | null;

interface BookmarkState {
  tree: FolderChildren[];
  folders: TopLevelFolder[];
  selectedFolder: Selection;
  breadcrumbs: FolderChildren[];
  folderChildrens: FolderChildren[];
  folderChildrenRaw: FolderChildren[];
  isLoading: boolean;
  isMoving: boolean;
  error: string | null;
  fetchFolders: () => Promise<void>;
  fetchFolderChildrens: () => Promise<void>;
  setSelectedFolder: (folder: Selection) => Promise<void>;
  moveNode: (id: string, parentId: string, index?: number) => Promise<boolean>;
}

function selectedView(tree: FolderChildren[], selection: Selection) {
  const path = selection ? bookmarkPath(tree, selection.id) : [];
  const selected = path[path.length - 1];
  const folderChildrenRaw = selected?.children ?? [];
  const loose = folderChildrenRaw.filter(isBookmark);
  const folderChildrens = folderChildrenRaw.filter(isFolder);
  if (selected && loose.length)
    folderChildrens.unshift({ ...selected, title: 'Bookmarks in this folder', children: loose });
  return {
    selectedFolder: selected ? { id: selected.id, title: selected.title } : null,
    breadcrumbs: path,
    folderChildrenRaw,
    folderChildrens,
  };
}

let generation = 0;
export const bookmarkStore = createStore<BookmarkState>()(
  persist(
    syncTabs(
      (set, get) => ({
        tree: [],
        folders: [],
        selectedFolder: null,
        breadcrumbs: [],
        folderChildrens: [],
        folderChildrenRaw: [],
        isLoading: false,
        isMoving: false,
        error: null,
        fetchFolders: async () => {
          const request = ++generation;
          set({ isLoading: true });
          try {
            const tree = await getBookmarksTree();
            if (request !== generation) return;
            const folders = tree.filter(isFolder).map((root) => ({
              id: root.id,
              title: root.title,
              children: (root.children ?? []).filter(isFolder).map((node, index) => ({
                id: node.id,
                title: node.title,
                index: node.index ?? index,
              })),
            }));
            const previous = get().selectedFolder;
            const previousNode = previous && findBookmark(tree, previous.id);
            const fallback = tree[0]?.children?.find(isFolder) ?? tree[0];
            const selection =
              previousNode && isFolder(previousNode)
                ? previous
                : fallback
                  ? { id: fallback.id, title: fallback.title }
                  : null;
            set({ tree, folders, ...selectedView(tree, selection), isLoading: false, error: null });
          } catch (error) {
            if (request !== generation) return;
            set({ isLoading: false, error: `Could not load bookmarks: ${String(error)}` });
            throw error;
          }
        },
        fetchFolderChildrens: async () => get().fetchFolders(),
        setSelectedFolder: async (folder) => {
          if (folder?.id === get().selectedFolder?.id) return;
          const node = folder && findBookmark(get().tree, folder.id);
          if (folder && (!node || !isFolder(node))) return;
          set(selectedView(get().tree, folder));
        },
        moveNode: async (id, parentId, index) => {
          if (get().isMoving || get().isLoading || get().error) return false;
          const node = findBookmark(get().tree, id);
          const parent = findBookmark(get().tree, parentId);
          if (
            !node?.parentId ||
            node.readOnly ||
            get().tree.some((root) => root.id === id) ||
            !parent ||
            !isFolder(parent) ||
            id === parentId ||
            (isFolder(node) && !!findBookmark(node.children ?? [], parentId))
          )
            return false;
          const source = findBookmark(get().tree, node.parentId);
          const oldIndex = source?.children?.findIndex((child) => child.id === id) ?? -1;
          const slot = index ?? parent.children?.length ?? 0;
          if (slot < 0 || slot > (parent.children?.length ?? 0)) return false;
          if (node.parentId === parentId && (slot === oldIndex || slot === oldIndex + 1)) return true;
          set({ isMoving: true, error: null });
          let moved = false;
          try {
            await moveBookmark(id, {
              parentId,
              index: slot - (node.parentId === parentId && slot > oldIndex ? 1 : 0),
              previousParentId: node.parentId,
              previousIndex: oldIndex,
            });
            moved = true;
            await get().fetchFolders();
            return true;
          } catch (error) {
            set({
              error: moved
                ? 'Moved, but the view could not be refreshed. Reload bookmarks to continue.'
                : `Could not move bookmark: ${String(error)}`,
            });
            return moved;
          } finally {
            set({ isMoving: false });
          }
        },
      }),
      {
        name: 'bookmark-channel',
        include: ['tree', 'folders', 'selectedFolder', 'breadcrumbs', 'folderChildrens', 'folderChildrenRaw'],
      },
    ),
    {
      name: 'bookmark-storage',
      version: 3,
      storage: createJSONStorage(() => platform.storage),
      partialize: (state) => ({ selectedFolder: state.selectedFolder }),
      migrate: (state) => ({ selectedFolder: (state as { selectedFolder?: Selection }).selectedFolder ?? null }),
    },
  ),
);
