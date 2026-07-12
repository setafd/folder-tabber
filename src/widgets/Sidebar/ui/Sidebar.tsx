import { useCallback, useMemo } from 'react';

import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';

import { FolderDeleteConfirmModal } from '@features/folder/delete';

import { bookmarkStore } from '@entities/bookmark';

import { useHotkeys } from '@shared/lib/hooks';

import { NUMBER_HOTKEYS } from '../Sidebar.const';
import { getIndexByKeyboardNumber } from '../Sidebar.lib';

import { SidebarGroup } from './SidebarGroup';

import styles from './Sidebar.module.scss';

export const Sidebar = () => {
  const folders = useStore(
    bookmarkStore,
    useShallow((state) => state.folders),
  );
  const setSelectedFolder = useStore(bookmarkStore, (state) => state.setSelectedFolder);

  const onChangeFolder = useCallback(
    (id: string, title: string) => {
      setSelectedFolder({ id, title });
    },
    [setSelectedFolder],
  );

  const flatFolders = useMemo(() => folders.flatMap((f) => f.children), [folders]);

  const onNumberPressed = useCallback(
    (key: (typeof NUMBER_HOTKEYS)[number]) => {
      const index = getIndexByKeyboardNumber(key);
      const folder = flatFolders[index];
      if (folder) {
        onChangeFolder(folder.id, folder.title);
      }
    },
    [flatFolders, onChangeFolder],
  );

  useHotkeys(NUMBER_HOTKEYS, onNumberPressed);

  return (
    <nav aria-label="Navigation" className={styles.navigation}>
      {folders.map((parent) => (
        <SidebarGroup key={parent.id} parent={parent} onChangeFolder={onChangeFolder} />
      ))}
      <FolderDeleteConfirmModal />
    </nav>
  );
};
