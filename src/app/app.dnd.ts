import { useMemo, useRef, useState } from 'react';

import {
  CollisionDetection,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';

import { FolderChildren, TopLevelFolder, bookmarkStore, moveBookmark, resolveMoveIndex } from '@entities/bookmark';

import { fromContainerId, toContainerId } from '@shared/lib/dnd';

type DndNode = { id: string; title: string; isFolder: boolean; url?: string };

type DropData = { type?: 'item' | 'container'; parentId?: string; isFolder?: boolean };

function buildMaps(folders: TopLevelFolder[], rawChildren: FolderChildren[], selectedId?: string) {
  const childrenByParent = new Map<string, DndNode[]>();
  const containerByItem = new Map<string, string>();

  const setContainer = (parentId: string, nodes: DndNode[]) => {
    childrenByParent.set(parentId, nodes);
    for (const node of nodes) containerByItem.set(node.id, parentId);
  };

  for (const root of folders) {
    setContainer(
      root.id,
      root.children.map((folder) => ({ id: folder.id, title: folder.title, isFolder: true })),
    );
  }

  if (selectedId) {
    const walk = (parentId: string, nodes: FolderChildren[]) => {
      setContainer(
        parentId,
        nodes.map((node) => ({ id: node.id, title: node.title, isFolder: !!node.children, url: node.url })),
      );
      for (const node of nodes) if (node.children) walk(node.id, node.children);
    };
    walk(selectedId, rawChildren);
  }

  return { childrenByParent, containerByItem };
}

function isDescendant(childrenByParent: Map<string, DndNode[]>, ancestorId: string, candidateId: string): boolean {
  const stack = [...(childrenByParent.get(ancestorId) ?? [])];
  while (stack.length) {
    const node = stack.pop()!;
    if (node.id === candidateId) return true;
    const kids = childrenByParent.get(node.id);
    if (kids) stack.push(...kids);
  }
  return false;
}

export const useAppDnd = () => {
  const folders = useStore(
    bookmarkStore,
    useShallow((state) => state.folders),
  );
  const rawChildren = useStore(
    bookmarkStore,
    useShallow((state) => state.folderChildrenRaw),
  );
  const selectedId = useStore(bookmarkStore, (state) => state.selectedFolder?.id);

  const [activeId, setActiveId] = useState<string | null>(null);
  const isBelowRef = useRef<boolean | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 10 } }));

  const { childrenByParent, containerByItem } = useMemo(
    () => buildMaps(folders, rawChildren, selectedId),
    [folders, rawChildren, selectedId],
  );

  const nodeById = (id: string): DndNode | undefined => {
    const parentId = containerByItem.get(id);
    return parentId ? childrenByParent.get(parentId)?.find((node) => node.id === id) : undefined;
  };

  const collisionDetection: CollisionDetection = (args) => {
    const ownContainerId = toContainerId(args.active.id as string);
    const corners = closestCorners(args).filter((collision) => collision.id !== ownContainerId);
    const withinIds = new Set(pointerWithin(args).map((collision) => collision.id));

    const candidates = withinIds.size ? corners.filter((collision) => withinIds.has(collision.id)) : corners;
    const dataOf = (collision: (typeof candidates)[number]) =>
      collision.data?.droppableContainer?.data?.current as DropData | undefined;

    const items = candidates.filter((collision) => dataOf(collision)?.type === 'item');
    return items.length ? items : candidates;
  };

  const onDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    const translated = active.rect.current.translated;
    if (!over || !translated) return;

    const overCenterY = over.rect.top + over.rect.height / 2;
    const activeCenterY = translated.top + translated.height / 2;
    isBelowRef.current = activeCenterY < overCenterY;
  };

  const onDragEnd = (event: DragEndEvent) => {
    const isBelow = isBelowRef.current;
    isBelowRef.current = null;
    setActiveId(null);

    const { active, over } = event;
    if (!over) return;

    const draggedId = active.id as string;
    const overId = over.id as string;
    const overData = over.data.current as DropData | undefined;

    const sourceParentId = containerByItem.get(draggedId);
    if (!sourceParentId) return;

    const draggedIsFolder = !!nodeById(draggedId)?.isFolder;

    let targetParentId: string | undefined;
    let append = true;

    if (overData?.type === 'container') {
      targetParentId = overData.parentId;
    } else if (overData?.type === 'item' && overData.parentId) {
      if (overData.isFolder && !draggedIsFolder) {
        targetParentId = overId;
      } else {
        targetParentId = overData.parentId;
        append = false;
      }
    } else {
      targetParentId = fromContainerId(overId) ?? containerByItem.get(overId) ?? undefined;
    }

    if (!targetParentId) return;

    if (draggedIsFolder && (targetParentId === draggedId || isDescendant(childrenByParent, draggedId, targetParentId))) {
      return;
    }

    const targetChildren = childrenByParent.get(targetParentId);

    if (!targetChildren) {
      moveBookmark(draggedId, { parentId: targetParentId });

      const store = bookmarkStore.getState();
      store.fetchFolders();
      if (store.selectedFolder) store.fetchFolderChildrens();
      return;
    }

    const overIndex = append ? targetChildren.length : targetChildren.findIndex((n) => n.id === overId);
    if (overIndex < 0) return;

    const sourceChildren = childrenByParent.get(sourceParentId) ?? [];
    const oldIndex = sourceChildren.findIndex((node) => node.id === draggedId);
    if (oldIndex < 0) return;

    const isSameContainer = sourceParentId === targetParentId;
    const resolved = resolveMoveIndex({ isSameContainer, isBelow, oldIndex, overIndex });
    if (!resolved) return;

    moveBookmark(draggedId, { parentId: targetParentId, index: resolved.apiIndex });

    const store = bookmarkStore.getState();
    store.fetchFolders();
    if (store.selectedFolder) store.fetchFolderChildrens();
  };

  const onDragCancel = () => {
    setActiveId(null);
    isBelowRef.current = null;
  };

  const activeNode = activeId ? nodeById(activeId) : undefined;

  return {
    sensors,
    collisionDetection,
    activeNode,
    dndContextProps: { onDragStart, onDragOver, onDragEnd, onDragCancel },
  };
};
