import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';

import { bookmarkStore, createBookmark } from '@entities/bookmark';

export const useCreateFolder = (parentId: string) => {
  const [isInput, setIsInput] = useState(false);
  const { register, handleSubmit } = useForm<{ title: string }>({
    resolver: zodResolver(z.object({ title: z.string().nonempty() })),
  });

  const onSubmit: SubmitHandler<{ title: string }> = async ({ title }) => {
    setIsInput(false);

    return createBookmark({ title, parentId })
      .then((folder) => {
        bookmarkStore
          .getState()
          .fetchFolders()
          .then(() => {
            bookmarkStore.getState().setSelectedFolder(folder.id, title);
          });
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    event.stopPropagation();
    if (event.key === 'Escape') {
      setIsInput(false);
    }
  };

  return {
    showInput: () => setIsInput(true),
    hideInput: () => setIsInput(false),
    isInput,
    register,
    onKeyDown,
    onSubmit: handleSubmit(onSubmit),
  };
};
