import { getSubTree } from '@entities/bookmark';

import { DeleteSquareIcon } from '@shared/icons';
import { Button } from '@shared/ui/Button';
import { Modal } from '@shared/ui/Modal';

import { onDeleteFolder } from './folder-delete.lib';
import { useDeleteFolderState } from './folder-delete.model';

import styles from './folder-delete.module.scss';

export const FolderDeleteButton = ({ id }: { id: string }) => {
  const openConfirmModal = useDeleteFolderState((state) => state.toggleOpenConfirm);

  const onDeleteFolderWrapper = async (id: string) => {
    const currentTree = await getSubTree(id);

    if (currentTree[0].children?.length) {
      openConfirmModal(id);

      return;
    }

    onDeleteFolder(id);
  };

  return (
    <Button variant="icon" className={styles.deleteButton} onClick={() => onDeleteFolderWrapper(id)}>
      <DeleteSquareIcon className={styles.deleteIcon} size={20} />
    </Button>
  );
};

export const FolderDeleteConfirmModal = () => {
  const { isOpenConfirmFor: id, toggleOpenConfirm } = useDeleteFolderState();

  return (
    <Modal
      ariaDescribedby="delete-description"
      open={!!id}
      onClose={() => toggleOpenConfirm(null)}
      title="Delete folder"
    >
      <div className={styles.deleteConfirmModal}>
        <p className={styles.description} id="delete-description">
          This folder has bookmarks. Are you sure you want to delete it and all its children?
        </p>
        <div className={styles.footer}>
          <Button variant="danger" onClick={() => onDeleteFolder(id!, true)}>
            Yes
          </Button>
          <Button variant="default" onClick={() => toggleOpenConfirm(null)}>
            No
          </Button>
        </div>
      </div>
    </Modal>
  );
};
