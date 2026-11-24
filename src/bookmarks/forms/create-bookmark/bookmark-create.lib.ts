import { type BookmarkCreate, bookmarkStore, createBookmark } from '@/bookmarks';

export const useCreateBookmark = () => {
  const createNewBookmark = async (details: BookmarkCreate) => {
    await createBookmark(details)
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        bookmarkStore.getState().fetchFolderChildrens();
      });
  };
  return { createNewBookmark };
};
