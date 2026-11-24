import { useStore } from 'zustand';

import { bookmarkStore } from '@/bookmarks';

export const useBookmarks = () => {
  const folders = useStore(bookmarkStore, (s) => s.folderChildrens);
  const selectedFolder = useStore(bookmarkStore, (s) => s.selectedFolder);
  return {
    folders,
    isEmpty: folders.length === 0 && !!selectedFolder,
    title: selectedFolder?.title,
    folderId: selectedFolder?.id,
  };
};
