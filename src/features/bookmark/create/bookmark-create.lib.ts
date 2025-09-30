import { bookmarkStore, createBookmark } from '@entities/bookmark';

export const useCreateBookmark = () => {
  const createNewBookmark = async (details: chrome.bookmarks.CreateDetails) => {
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
