import { modals } from '@mantine/modals';

import { bookmarkStore, deleteBookmark, deleteBookmarkTree, getSubTree } from '@entities/bookmark';

export const useDeleteFolder = () => {
  const onDeleteFolder = async (id: string, force = false) => {
    const operation = force ? deleteBookmarkTree(id) : deleteBookmark(id);
    bookmarkStore.setState(({ folders }) => ({ folders: folders.filter((folder) => folder.id !== id) }));
    await operation
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        bookmarkStore.getState().fetchFolders();
      });
  };

  const onDeleteFolderWrapper = async (id: string) => {
    const currentTree = await getSubTree(id);

    if (currentTree[0].children?.length) {
      modals.openConfirmModal({
        title: 'Delete folder',
        children: 'This folder has bookmarks. Are you sure you want to delete it and all its children?',
        labels: { confirm: 'Yes', cancel: 'No' },
        onConfirm: () => onDeleteFolder(id, true),
      });

      return;
    }

    onDeleteFolder(id);
  };

  return { onDeleteFolder: onDeleteFolderWrapper };
};
