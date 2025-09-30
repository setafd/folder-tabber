import { bookmarkStore, deleteBookmark, deleteBookmarkTree } from '@entities/bookmark';

export const useDeleteBookmark = () => {
  const onDeleteBookmark = async (id: string, force = false) => {
    const operation = force ? deleteBookmarkTree(id) : deleteBookmark(id);
    await operation
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        bookmarkStore.getState().fetchFolderChildrens();
      });
  };

  return { onDeleteBookmark };
};
