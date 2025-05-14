import { useState } from 'react';

import { editBookmarkFolder } from '@entities/bookmark';

export const useRenameFolder = () => {
  const [currentId, setCurrentId] = useState<string | null>(null);

  const onEditFolder = async (id: string, title: string) => {
    return editBookmarkFolder(id, { title })?.then(
      () => {
        setCurrentId(null);
      },
      (error) => {
        console.error(error);
      },
    );
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
    editableId: currentId,
    inputProps: {
      onKeyDown,
      autoFocus: true,
      onBlur: () => setCurrentId(null),
    },
  };
};
