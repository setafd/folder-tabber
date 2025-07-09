import { useEffect } from 'react';

import { useStore } from 'zustand';

import { type FolderChildren, bookmarkStore, getSubTree } from '@entities/bookmark';

export const useBookmarks = () => {
  const setFolderChildrens = useStore(bookmarkStore, (state) => state.setFolderChildrens);
  const bookmarks = useStore(bookmarkStore, (state) => state.folderChildrens);
  const selectedFolder = useStore(bookmarkStore, (state) => state.selectedFolder);

  useEffect(() => {
    if (selectedFolder) {
      getSubTree(selectedFolder?.id).then(([folder]) => {
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
          [{ id: '-1', children: [], syncing: false, title: 'Default' }],
        );

        setFolderChildrens(mappedSubTree);
      });
    }
  }, [selectedFolder, setFolderChildrens]);

  const isEmpty = bookmarks.length === 0 && selectedFolder;

  return { bookmarks, isEmpty, title: selectedFolder?.title };
};
