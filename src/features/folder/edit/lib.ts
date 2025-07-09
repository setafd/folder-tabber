import { useState } from 'react';

import { bookmarkStore, editBookmark } from '@entities/bookmark';

export const useRenameFolder = () => {
  const [currentId, setCurrentId] = useState<string | null>(null);

  const onEditFolder = async (id: string, title: string) => {
    bookmarkStore.setState(({ folders }) => {
      return { folders: folders.map((folder) => (folder.id === id ? { ...folder, title } : folder)) };
    });
    setCurrentId(null);
    await editBookmark(id, { title })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        bookmarkStore.getState().fetchFolders();
      });
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      if (event.currentTarget.value) {
        onEditFolder(currentId!, event.currentTarget.value);
      }
    }

    if (event.key === 'Escape') {
      setCurrentId(null);
    }
  };

  return {
    showInput: (id: string) => setCurrentId(id),
    hideInput: () => setCurrentId(null),
    editableId: currentId,
    inputProps: {
      onKeyDown,
      autoFocus: true,
    },
  };
};
