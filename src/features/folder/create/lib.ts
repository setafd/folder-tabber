import { useState } from 'react';

import { bookmarkStore, createBookmark } from '@entities/bookmark';

export const useCreateFolder = () => {
  const [isInput, setIsInput] = useState(false);

  const onCreateFolder = async (title: string) => {
    const possibleParentsIds = bookmarkStore.getState().rootParentsIds;
    if (possibleParentsIds.length === 0) {
      return;
    }

    const parentId = possibleParentsIds[possibleParentsIds.length - 1];

    const mappedFolder = {
      index: 0,
      id: 'new',
      title: title,
    };
    bookmarkStore.setState(({ folders }) => ({ folders: [...folders, mappedFolder] }));

    setIsInput(false);
    return createBookmark({ title, parentId })
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
        onCreateFolder(event.currentTarget.value);
      }
    }

    if (event.key === 'Escape') {
      setIsInput(false);
    }
  };

  return {
    showInput: () => setIsInput(true),
    hideInput: () => setIsInput(false),
    isInput,
    inputProps: {
      onKeyDown,
      autoFocus: true,
    },
  };
};
