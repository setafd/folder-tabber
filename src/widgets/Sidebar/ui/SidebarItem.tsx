import { FolderDeleteButton } from '@features/folder/delete';
import { FolderEditItemWrapper } from '@features/folder/edit';

import { type TopLevelFolder, useBookmarkDrag } from '@entities/bookmark';

import { DragHandleIcon } from '@shared/icons';

import styles from './Sidebar.module.scss';

export const SidebarItem = ({
  folder,
  parentId,
  isSelected,
  onChangeFolder,
}: {
  folder: TopLevelFolder['children'][number];
  parentId: string;
  isSelected: boolean;
  onChangeFolder: (id: string, title: string) => void;
}) => {
  const drag = useBookmarkDrag({ ...folder, parentId }, 'sidebar');
  return (
    <li
      ref={(element) => {
        drag.setNodeRef(element);
        drag.setDropRef(element);
      }}
      className={styles.folderWrapper}
      data-drop={drag.intent}
      data-active={isSelected}
      style={{ opacity: drag.isDragging ? 0.35 : undefined }}
    >
      <button
        ref={drag.setActivatorNodeRef}
        {...drag.attributes}
        {...drag.listeners}
        className="drag-handle"
        disabled={drag.disabled}
        title="Drag to move"
        aria-label={`Drag ${folder.title}`}
      >
        <DragHandleIcon />
      </button>
      <FolderEditItemWrapper id={folder.id} title={folder.title}>
        {(showInput) => (
          <button
            title={folder.title}
            className={styles.folderItem}
            aria-current={isSelected ? 'page' : undefined}
            onClick={() => onChangeFolder(folder.id, folder.title)}
            onDoubleClick={showInput}
          >
            <span className={styles.folderLabel}>{folder.title}</span>
          </button>
        )}
      </FolderEditItemWrapper>
      <span className={styles.rowActions}>
        <FolderDeleteButton id={folder.id} />
      </span>
    </li>
  );
};
