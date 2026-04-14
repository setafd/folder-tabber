import { useCallback, useMemo } from 'react';

import { DndContext, DragOverlay, MeasuringStrategy, closestCorners } from '@dnd-kit/core';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';

import { FolderDeleteConfirmModal } from '@features/folder/delete';

import { bookmarkStore } from '@entities/bookmark';

import { useHotkeys } from '@shared/lib/hooks';

import { NUMBER_HOTKEYS } from '../Sidebar.const';
import { getIndexByKeyboardNumber, useDrag } from '../Sidebar.lib';

import { SidebarGroup } from './SidebarGroup';

import styles from './Sidebar.module.scss';

export const Sidebar = () => {
  const folders = useStore(
    bookmarkStore,
    useShallow((state) => state.folders),
  );
  const setSelectedFolder = useStore(bookmarkStore, (state) => state.setSelectedFolder);

  const { activeId, renderedFolders, dndContextProps, sensors } = useDrag({ folders });

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

  const flatRenderedFolders = useMemo(() => renderedFolders.flatMap((f) => f.children), [renderedFolders]);

  const activeItem = useMemo(() => flatRenderedFolders.find((f) => f.id === activeId), [flatRenderedFolders, activeId]);

  return (
    <DndContext
      collisionDetection={closestCorners}
      sensors={sensors}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
      {...dndContextProps}
    >
      <nav aria-label="Navigation" className={styles.navigation}>
        {renderedFolders.map((parent) => (
          <SidebarGroup key={parent.id} parent={parent} onChangeFolder={onChangeFolder} />
        ))}
        <FolderDeleteConfirmModal />
      </nav>
      <DragOverlay dropAnimation={null}>
        {activeItem && <div className={styles.folderItem}>{activeItem.title}</div>}
      </DragOverlay>
    </DndContext>
  );
};
