import { useMemo, useRef, useState } from 'react';

import { DragEndEvent, DragOverEvent, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';

import { TopLevelFolder, bookmarkStore, moveBookmark } from '@entities/bookmark';

import { NUMBER_HOTKEYS } from './Sidebar.const';

export const getIndexByKeyboardNumber = (number: (typeof NUMBER_HOTKEYS)[number]) => {
  if (number === '0') {
    return 9;
  }
  return Number(number) - 1;
};

function moveBetweenContainers(
  folders: TopLevelFolder[],
  activeId: string,
  sourceId: string,
  targetId: string,
  overId: string,
) {
  const source = folders.find((f) => f.id === sourceId);
  const target = folders.find((f) => f.id === targetId);
  if (!source || !target) return folders;

  const itemIndex = source.children.findIndex((c) => c.id === activeId);
  if (itemIndex === -1) return folders;

  const movedItem = { ...source.children[itemIndex] };
  const overIndex = target.children.findIndex((c) => c.id === overId);

  return folders.map((folder) => {
    if (folder.id === sourceId) {
      return {
        ...folder,
        children: folder.children.filter((c) => c.id !== activeId),
      };
    }

    if (folder.id === targetId) {
      const next = [...folder.children];
      next.splice(overIndex >= 0 ? overIndex : next.length, 0, movedItem);
      return { ...folder, children: next };
    }

    return folder;
  });
}

export const useDrag = ({ folders }: { folders: TopLevelFolder[] }) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draftFolders, setDraftFolders] = useState<TopLevelFolder[] | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 10 },
    }),
  );

  const isLastPositionBelowRef = useRef<boolean | null>(null);
  const originalParentRef = useRef<string | null>(null);

  const renderedFolders = draftFolders ?? folders;

  const draftContainerByItemId = useMemo(() => {
    const map = new Map<string, string>();
    renderedFolders.forEach((p) => p.children.forEach((c) => map.set(c.id, p.id)));
    return map;
  }, [renderedFolders]);

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || !draftFolders) return;

    const translated = active.rect.current.translated;
    if (translated) {
      const overRect = over.rect;
      const overCenterY = overRect.top + overRect.height / 2;

      const activeCenterY = translated.top + translated.height / 2;

      const isBelow = activeCenterY < overCenterY;

      isLastPositionBelowRef.current = isBelow;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const sourceId = draftContainerByItemId.get(activeId);
    const targetId = draftContainerByItemId.get(overId) ?? overId;

    if (!sourceId || !targetId || sourceId === targetId) return;

    setDraftFolders((prev) => (prev ? moveBetweenContainers(prev, activeId, sourceId, targetId, overId) : prev));
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null);

    setDraftFolders(null);

    if (!event.active) return;

    const id = event.active.id as string;
    const parentId = event.active.data.current?.sortable.containerId;

    const isBelow = isLastPositionBelowRef.current;

    isLastPositionBelowRef.current = null;

    const overIndex = event.over?.data.current?.sortable.index;
    const oldIndex = event.active.data.current?.sortable.index;

    if (overIndex == null || oldIndex == null || parentId == null) return;

    const sourceParentId = originalParentRef.current;

    const isSameContainer = parentId === sourceParentId;

    let newIndex = 0;
    if (isSameContainer) {
      if (overIndex === oldIndex) return;
      newIndex = overIndex < oldIndex ? (isBelow ? overIndex + 1 : overIndex) : isBelow ? overIndex : overIndex - 1;
    } else {
      if (overIndex === 0) {
        newIndex = 0;
      } else {
        newIndex = overIndex;
      }
    }

    const indexForAPI = isBelow ? (isSameContainer ? newIndex + 1 : newIndex) : newIndex;

    moveBookmark(id, { parentId, index: indexForAPI });

    bookmarkStore.setState((state) => {
      if (!sourceParentId) return state;

      let movedItem: TopLevelFolder['children'][number] | undefined;

      const next = state.folders.map((parent) => {
        if (parent.id === sourceParentId) {
          const idx = parent.children.findIndex((c) => c.id === id);
          if (idx === -1) return parent;

          movedItem = parent.children[idx];

          return {
            ...parent,
            children: parent.children.filter((c) => c.id !== id),
          };
        }

        return parent;
      });

      if (!movedItem) return state;

      return {
        folders: next.map((parent) => {
          if (parent.id !== parentId) return parent;

          const children = [...parent.children];
          children.splice(newIndex, 0, movedItem!);

          return { ...parent, children };
        }),
      };
    });
  };

  const onDragCancel = () => {
    setActiveId(null);
    setDraftFolders(null);
    isLastPositionBelowRef.current = null;
    originalParentRef.current = null;
  };

  const onDragStart = (event: DragStartEvent) => {
    originalParentRef.current = event.active.data.current?.sortable.containerId ?? null;
    setActiveId(event.active.id as string);
    setDraftFolders(folders);
  };

  return {
    activeId,
    renderedFolders,
    sensors,
    dndContextProps: {
      onDragStart,
      onDragOver,
      onDragEnd,
      onDragCancel,
    },
  };
};
