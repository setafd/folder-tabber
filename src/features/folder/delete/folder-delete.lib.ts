import { bookmarkStore, deleteBookmark, deleteBookmarkTree } from '@entities/bookmark';

export const onDeleteFolder = async (id: string, force = false) => {
  const operation = force ? deleteBookmarkTree(id) : deleteBookmark(id);
  bookmarkStore.setState(({ folders }) => ({ folders: folders.filter((folder) => folder.id !== id) }));
  await operation
    .catch((error) => {
      console.error(error);
    })
    .finally(() => {
      bookmarkStore.getState().setSelectedFolder(null);
      bookmarkStore.getState().fetchFolders();
    });
};
