import { useCallback } from 'react';

import { useStore } from 'zustand';

import { FolderCreateItem } from '@features/folder/create';
import { useDeleteFolder } from '@features/folder/delete';
import { FolderEditItemWrapper } from '@features/folder/edit';

import { bookmarkStore } from '@entities/bookmark';

import { DeleteSquareIcon } from '@shared/icons';
import { useHotkeys } from '@shared/lib/react';
import { Button } from '@shared/ui/Button';

import { NUMBER_HOTKEYS } from './Sidebar.const';
import { getIndexByKeyboardNumber } from './Sidebar.lib';

import styles from './Sidebar.module.scss';

export const Sidebar = () => {
  const folders = useStore(bookmarkStore, (state) => state.folders);
  const selectedFolderId = useStore(bookmarkStore, (state) => state.selectedFolder?.id);
  const setSelectedFolder = useStore(bookmarkStore, (state) => state.setSelectedFolder);

  const { onDeleteFolder } = useDeleteFolder();

  const onChangeFolder = useCallback(
    (id: string, title: string) => {
      setSelectedFolder({ id, title });
    },
    [setSelectedFolder],
  );

  const OnNumberPressed = useCallback(
    (key: (typeof NUMBER_HOTKEYS)[number]) => {
      const index = getIndexByKeyboardNumber(key);
      const folder = folders.flatMap((parent) => parent.children ?? [])[index];
      if (folder) {
        onChangeFolder(folder.id, folder.title);
      }
    },
    [folders, onChangeFolder],
  );

  useHotkeys(NUMBER_HOTKEYS, OnNumberPressed);

  return (
    <nav aria-label="Navigation" className={styles.navigation}>
      {folders.map((parent) => {
        return (
          <section aria-labelledby={`sidebar-section-${parent.id}`} key={parent.id} className={styles.section}>
            <h2 id={`sidebar-section-${parent.id}`} className={styles.sectionTitle}>
              {parent.title}
            </h2>
            <ul className={styles.folderList}>
              {parent.children?.map((folder) => (
                <li key={folder.id} className={styles.folderWrapper}>
                  <FolderEditItemWrapper id={folder.id} title={folder.title}>
                    {(showInput) => (
                      <button
                        onClick={() => onChangeFolder(folder.id, folder.title)}
                        onDoubleClick={showInput}
                        className={`${styles.folderItem} ${folder.id === selectedFolderId ? styles.active : ''}`}
                      >
                        {folder.title}
                      </button>
                    )}
                  </FolderEditItemWrapper>
                  <Button variant="icon" className={styles.deleteButton} onClick={() => onDeleteFolder(folder.id)}>
                    <DeleteSquareIcon className={styles.deleteIcon} size={20} />
                  </Button>
                </li>
              ))}
              <li>
                <FolderCreateItem buttonClassName={styles.folderItem} parentId={parent.id} />
              </li>
            </ul>
          </section>
        );
      })}
    </nav>
  );
};
