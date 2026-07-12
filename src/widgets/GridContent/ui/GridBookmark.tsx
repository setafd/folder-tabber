import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { BookmarkItem, BookmarkItemProps } from '@entities/bookmark';

export const GridBookmark = ({ parentId, ...props }: BookmarkItemProps & { parentId: string }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.id,
    data: { type: 'item', parentId, isFolder: false },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <BookmarkItem {...props} />
    </div>
  );
};
