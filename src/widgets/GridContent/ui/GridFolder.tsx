import { useMemo } from 'react';

import { useDraggable, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { BookmarkFolder, BookmarkItemProps, FolderChildren } from '@entities/bookmark';

import { FolderIcon } from '@shared/icons';
import { toContainerId } from '@shared/lib/dnd';

import { GridBookmark } from './GridBookmark';

type GridFolderProps = {
  folder: FolderChildren;
  /** True only for the selected folder's loose-bookmarks card (not draggable, not editable). */
  isRoot?: boolean;
  onClickBookmark: BookmarkItemProps['onClick'];
  onClickCreateButton: (parentId: string) => void;
  onClickEditButton: (type: 'bookmark' | 'folder', id: string, title: string, url?: string) => void;
};

export const GridFolder = ({
  folder,
  isRoot,
  onClickBookmark,
  onClickCreateButton,
  onClickEditButton,
}: GridFolderProps) => {
  const { setNodeRef: setDroppableRef } = useDroppable({
    id: toContainerId(folder.id),
    data: { type: 'container', parentId: folder.id },
  });
  // The root card's id is the selected folder's real id — the same id the Sidebar uses for
  // that folder's own entry. Its item-role draggable is never actually activatable (no
  // handle is rendered below, so no listeners are ever attached to trigger it), but the hook
  // must still be called (Rules of Hooks), and dnd-kit registers whatever id it's given
  // regardless of whether a node ref is attached. Giving it the raw folder id here would
  // collide with the Sidebar's real, activatable registration for that same folder in
  // dnd-kit's shared registry — reusing the container-id prefix keeps this inert registration
  // out of the raw-id namespace entirely.
  const { setNodeRef: setDraggableRef, setActivatorNodeRef, listeners, attributes } = useDraggable({
    id: isRoot ? toContainerId(folder.id) : folder.id,
    data: { type: 'item', isFolder: true },
  });

  const setCardRef = (element: HTMLElement | null) => {
    setDroppableRef(element);
    if (!isRoot) {
      setDraggableRef(element);
    }
  };

  const children = folder.children ?? [];
  const bookmarkIds = useMemo(
    () => (folder.children ?? []).filter((child) => !child.children).map((child) => child.id),
    [folder.children],
  );

  const dragHandle = isRoot ? undefined : (
    <span ref={setActivatorNodeRef} {...listeners} {...attributes} style={{ display: 'flex', cursor: 'grab' }}>
      <FolderIcon size={18} />
    </span>
  );

  return (
    <div ref={setCardRef}>
      <BookmarkFolder
        id={folder.id}
        title={folder.title}
        isRoot={isRoot}
        dragHandle={dragHandle}
        onClickCreateButton={() => onClickCreateButton(folder.id)}
        onEdit={onClickEditButton}
      >
        <SortableContext id={folder.id} items={bookmarkIds} strategy={verticalListSortingStrategy}>
          {children.map((child) =>
            child.children ? (
              <GridFolder
                key={child.id}
                folder={child}
                onClickBookmark={onClickBookmark}
                onClickCreateButton={onClickCreateButton}
                onClickEditButton={onClickEditButton}
              />
            ) : (
              <GridBookmark
                key={child.id}
                parentId={folder.id}
                id={child.id}
                url={child.url}
                title={child.title}
                onClick={onClickBookmark}
                onEdit={onClickEditButton}
              />
            ),
          )}
        </SortableContext>
      </BookmarkFolder>
    </div>
  );
};
