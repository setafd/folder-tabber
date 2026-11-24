import { useDraggable, useDroppable } from '@dnd-kit/core';
import { useStore } from 'zustand';

import { type DropData, useDropFeedback } from '@shared/lib/dnd';

import { type FolderChildren, bookmarkStore } from './bookmark.model';

export const useBookmarkDrag = (
  node: Pick<FolderChildren, 'id' | 'title' | 'url' | 'parentId'>,
  scope: string,
  inert = false,
  card = false,
) => {
  const disabled = useStore(bookmarkStore, (s) => s.isMoving || s.isLoading || !!s.error);
  const dropId = `item:${scope}:${node.id}`;
  const drag = useDraggable({ id: `drag:${scope}:${node.id}`, data: { nodeId: node.id }, disabled: disabled || inert });
  const drop = useDroppable({
    id: dropId,
    disabled: disabled || inert,
    data: {
      type: 'item',
      nodeId: node.id,
      parentId: node.parentId,
      isFolder: node.url === undefined,
      layout: card ? 'card' : undefined,
    } satisfies DropData,
  });
  return { ...drag, setDropRef: drop.setNodeRef, intent: useDropFeedback(dropId), disabled: disabled || inert };
};

export const useFolderDrop = (id: string, scope: string) => {
  const disabled = useStore(bookmarkStore, (s) => s.isMoving || s.isLoading || !!s.error);
  const dropId = `container:${scope}:${id}`;
  const drop = useDroppable({
    id: dropId,
    disabled: disabled || !id,
    data: { type: 'container', nodeId: id } satisfies DropData,
  });
  return { setNodeRef: drop.setNodeRef, intent: useDropFeedback(dropId) };
};
