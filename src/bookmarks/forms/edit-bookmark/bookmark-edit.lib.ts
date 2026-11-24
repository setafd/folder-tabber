import { type BookmarkUpdate, bookmarkStore, editBookmark } from '@/bookmarks';

export const useUpdateBookmark = () => {
  const updateBookmark = async (id: string, details: BookmarkUpdate) => {
    await editBookmark(id, details)
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        bookmarkStore.getState().fetchFolderChildrens();
      });
  };
  return { updateBookmark };
};
