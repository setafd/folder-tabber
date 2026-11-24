import { memo } from 'react';

import { BookmarkItem, type BookmarkItemProps, useBookmarkDrag } from '@/bookmarks';
import { DragHandleIcon } from '@/ui/icons';

export const GridBookmark = memo(function GridBookmark({
  parentId,
  ...props
}: BookmarkItemProps & { parentId: string }) {
  const drag = useBookmarkDrag({ ...props, parentId }, 'grid');
  return (
    <div
      ref={(element) => {
        drag.setNodeRef(element);
        drag.setDropRef(element);
      }}
      data-drop={drag.intent}
      className="bookmark-drop"
      style={{ opacity: drag.isDragging ? 0.35 : undefined }}
    >
      <BookmarkItem
        {...props}
        dragHandle={
          <button
            ref={drag.setActivatorNodeRef}
            {...drag.attributes}
            {...drag.listeners}
            disabled={drag.disabled}
            className="drag-handle"
            aria-label={`Drag ${props.title}`}
            title="Drag to move"
          >
            <DragHandleIcon />
          </button>
        }
      />
    </div>
  );
});
