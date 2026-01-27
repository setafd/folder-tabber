import { memo } from 'react';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { FolderDeleteButton } from '@features/folder/delete';
import { FolderEditItemWrapper } from '@features/folder/edit';

import { TopLevelFolder } from '@entities/bookmark';

import styles from './Sidebar.module.scss';

const SidebarItemRaw = ({
  folder,
  onChangeFolder,
  isSelected,
  isReorderMode,
}: {
  folder: TopLevelFolder['children'][number];
  onChangeFolder: (id: string, title: string) => void;
  isSelected: boolean;
  isReorderMode: boolean;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: folder.id,
    disabled: !isReorderMode,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li ref={setNodeRef} style={style} className={styles.folderWrapper}>
      {isReorderMode && (
        <span className={styles.dragHandle} {...attributes} {...listeners} onClick={(e) => e.stopPropagation()}>
          ⋮
        </span>
      )}
      <FolderEditItemWrapper id={folder.id} title={folder.title}>
        {(showInput) => (
          <button
            onClick={() => onChangeFolder(folder.id, folder.title)}
            onDoubleClick={showInput}
            className={`${styles.folderItem} ${isSelected ? styles.active : ''}`}
          >
            {folder.title}
          </button>
        )}
      </FolderEditItemWrapper>
      <FolderDeleteButton id={folder.id} />
    </li>
  );
};

export const SidebarItem = memo(
  SidebarItemRaw,
  (prev, next) =>
    prev.folder.id === next.folder.id &&
    prev.folder.title === next.folder.title &&
    prev.isSelected === next.isSelected &&
    prev.isReorderMode === next.isReorderMode,
);
