import { modals } from '@mantine/modals';

import { deleteBookmarkFolder, getSubTree } from '@entities/bookmark';

export const useDeleteFolder = () => {
  const onDeleteFolder = (id: string, force = false) => {
    return deleteBookmarkFolder(id, force);
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
