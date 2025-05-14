import { useState } from 'react';

import { createBookmarkFolder } from '@entities/bookmark';

export const useCreateFolder = () => {
  const [isInput, setIsInput] = useState(false);

  const onCreateFolder = async (title: string) => {
    return createBookmarkFolder(title)?.then(
      () => {
        setIsInput(false);
      },
      (error) => {
        console.error(error);
      },
    );
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
    isInput,
    inputProps: {
      onKeyDown,
      autoFocus: true,
      onBlur: () => setIsInput(false),
    },
  };
};
