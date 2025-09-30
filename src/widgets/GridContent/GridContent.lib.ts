import { useEffect } from 'react';

import { useStore } from 'zustand';

import { bookmarkStore } from '@entities/bookmark';

export const useBookmarks = () => {
  const fetchFolderChildrens = useStore(bookmarkStore, (state) => state.fetchFolderChildrens);
  const folders = useStore(bookmarkStore, (state) => state.folderChildrens);
  const selectedFolder = useStore(bookmarkStore, (state) => state.selectedFolder);

  useEffect(() => {
    if (selectedFolder) {
      fetchFolderChildrens();
    }
  }, [selectedFolder, fetchFolderChildrens]);

  const isEmpty = folders.length === 0 && selectedFolder;

  return { folders, isEmpty, title: selectedFolder?.title, folderId: selectedFolder?.id };
};
