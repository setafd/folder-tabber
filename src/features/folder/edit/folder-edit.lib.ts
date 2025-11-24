import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';

import { bookmarkStore, editBookmark } from '@entities/bookmark';

export const useRenameFolder = (id: string, title: string) => {
  const [isInput, setIsInput] = useState(false);
  const { register, handleSubmit } = useForm<{ title: string }>({
    resolver: zodResolver(z.object({ title: z.string().nonempty() })),
    defaultValues: { title },
  });

  const onSubmit: SubmitHandler<{ title: string }> = async ({ title }) => {
    bookmarkStore.setState(({ folders }) => {
      return { folders: folders.map((folder) => (folder.id === id ? { ...folder, title } : folder)) };
    });
    setIsInput(false);
    await editBookmark(id, { title })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        bookmarkStore.getState().fetchFolders();
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
    register,
    onSubmit: handleSubmit(onSubmit),
    isInput: isInput,
    onKeyDown,
  };
};
