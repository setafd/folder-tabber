import { bookmarkStore, editBookmark } from '@entities/bookmark';

export const useUpdateBookmark = () => {
  const updateBookmark = async (id: string, details: chrome.bookmarks.UpdateChanges) => {
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
