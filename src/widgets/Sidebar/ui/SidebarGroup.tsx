import { memo, useMemo } from 'react';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useStore } from 'zustand';

import { FolderCreateItem } from '@features/folder/create';

import { TopLevelFolder, bookmarkStore } from '@entities/bookmark';

import { SidebarItem } from './SidebarItem';

import styles from './Sidebar.module.scss';

const SidebarGroupRaw = ({
  parent,
  onChangeFolder,
  isReorderMode,
}: {
  parent: TopLevelFolder;
  onChangeFolder: (id: string, title: string) => void;
  isReorderMode: boolean;
}) => {
  const selectedFolderId = useStore(bookmarkStore, (state) => state.selectedFolder?.id);

  const { setNodeRef } = useDroppable({
    id: parent.id,
    disabled: !isReorderMode,
  });

  const itemsIds = useMemo(() => parent.children.map((folder) => folder.id), [parent.children]);

  return (
    <section aria-labelledby={`sidebar-section-${parent.id}`} id={parent.id} className={styles.section}>
      <h2 id={`sidebar-section-${parent.id}`} className={styles.sectionTitle}>
        {parent.title}
      </h2>
      <SortableContext
        id={parent.id}
        items={itemsIds}
        strategy={verticalListSortingStrategy}
      >
        <ul ref={setNodeRef} className={styles.folderList}>
          {parent.children.map((folder) => (
            <SidebarItem
              key={folder.id}
              isReorderMode={isReorderMode}
              folder={folder}
              isSelected={folder.id === selectedFolderId}
              onChangeFolder={onChangeFolder}
            />
          ))}
          <li>
            <FolderCreateItem buttonClassName={styles.folderItem} parentId={parent.id} />
          </li>
        </ul>
      </SortableContext>
    </section>
  );
};

export const SidebarGroup = memo(SidebarGroupRaw);
