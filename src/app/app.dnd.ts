import { useMemo, useRef, useState } from 'react';

import {
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useStore } from 'zustand';

import { type FolderChildren, bookmarkStore, isFolder, resolveMoveIndex } from '@/bookmarks';
import { type DropData, type DropIntent } from '@/lib/dnd';

type Rect = { top: number; left: number; width: number; height: number };
export function dropIntent(data: DropData, point: { x: number; y: number }, rect: Rect): DropIntent {
  if (data.type === 'container') return 'inside';
  if (!data.isFolder) return point.y < rect.top + rect.height / 2 ? 'before' : 'after';
  if (point.y < rect.top + Math.min(9, rect.height / 4) || (data.layout === 'card' && point.x < rect.left + 16))
    return 'before';
  if (
    point.y > rect.top + rect.height - Math.min(9, rect.height / 4) ||
    (data.layout === 'card' && point.x > rect.left + rect.width - 16)
  )
    return 'after';
  return 'inside';
}

export function indexTree(tree: FolderChildren[]) {
  const map = new Map<string, FolderChildren>();
  const walk = (nodes: FolderChildren[], parentId?: string) => {
    for (const node of nodes) {
      map.set(node.id, { ...node, parentId: node.parentId ?? parentId });
      if (node.children) walk(node.children, node.id);
    }
  };
  walk(tree);
  return map;
}

export const useAppDnd = () => {
  const tree = useStore(bookmarkStore, (s) => s.tree);
  const nodes = useMemo(() => indexTree(tree), [tree]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hint, setHint] = useState<{ target: string | null; intent: DropIntent | null }>({
    target: null,
    intent: null,
  });
  const latest = useRef<{ id: string; data: DropData; point: { x: number; y: number }; rect: Rect } | null>(null);
  const exclusions = useRef<{ nodes: typeof nodes; sourceId: string | undefined; ids: Set<string> } | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const activeNode = activeId ? nodes.get(activeId) : undefined;

  const collisionDetection: CollisionDetection = (args) => {
    latest.current = null;
    if (!args.pointerCoordinates) return [];
    const sourceId = args.active.data.current?.nodeId as string | undefined;
    if (!exclusions.current || exclusions.current.nodes !== nodes || exclusions.current.sourceId !== sourceId) {
      const forbidden = new Set<string>();
      const collect = (id: string) => {
        forbidden.add(id);
        for (const child of nodes.get(id)?.children ?? []) collect(child.id);
      };
      if (sourceId) collect(sourceId);
      exclusions.current = { nodes, sourceId, ids: forbidden };
    }
    const forbidden = exclusions.current.ids;
    const within = pointerWithin(args);
    if (within.some((collision) => forbidden.has(collision.data?.droppableContainer?.data.current?.nodeId))) return [];
    const candidates = within
      .filter((collision) => {
        const data = collision.data?.droppableContainer?.data.current as DropData | undefined;
        if (!data || forbidden.has(data.nodeId)) return false;
        const node = nodes.get(data.nodeId);
        if (!node) return false;
        return data.type !== 'container' || isFolder(node);
      })
      .sort((a, b) => {
        const ad = a.data!.droppableContainer.data.current as DropData;
        const bd = b.data!.droppableContainer.data.current as DropData;
        const ar = args.droppableRects.get(a.id)!;
        const br = args.droppableRects.get(b.id)!;
        return (
          (ad.type === 'item' ? 0 : 1) - (bd.type === 'item' ? 0 : 1) || ar.width * ar.height - br.width * br.height
        );
      });
    const winner = candidates[0];
    if (winner)
      latest.current = {
        id: String(winner.id),
        data: winner.data!.droppableContainer.data.current as DropData,
        rect: args.droppableRects.get(winner.id)!,
        point: args.pointerCoordinates,
      };
    return candidates;
  };
  const updateHint = () => {
    const choice = latest.current;
    const next = choice
      ? { target: choice.id, intent: dropIntent(choice.data, choice.point, choice.rect) }
      : { target: null, intent: null };
    setHint((previous) => (previous.target === next.target && previous.intent === next.intent ? previous : next));
  };
  const reset = () => {
    setActiveId(null);
    setHint({ target: null, intent: null });
    latest.current = null;
  };
  const onDragStart = (event: DragStartEvent) => {
    latest.current = null;
    setActiveId(event.active.data.current?.nodeId ?? null);
  };
  const onDragEnd = async (event: DragEndEvent) => {
    const choice = latest.current;
    reset();
    const id = event.active.data.current?.nodeId as string | undefined;
    if (!id || !choice || String(event.over?.id) !== choice.id) return;
    const intent = dropIntent(choice.data, choice.point, choice.rect);
    const target = nodes.get(choice.data.nodeId);
    const parentId = intent === 'inside' ? target?.id : target?.parentId;
    const parent = parentId ? nodes.get(parentId) : undefined;
    if (!parentId || !parent || !isFolder(parent)) return;
    const overIndex = parent.children?.findIndex((node) => node.id === target?.id) ?? -1;
    if (intent !== 'inside' && overIndex < 0) return;
    let index = parent.children?.length ?? 0;
    if (intent !== 'inside') {
      const sourceParent = nodes.get(nodes.get(id)?.parentId ?? '');
      const oldIndex = sourceParent?.children?.findIndex((child) => child.id === id) ?? -1;
      const resolved = resolveMoveIndex({
        isSameContainer: sourceParent?.id === parentId,
        oldIndex,
        overIndex,
        isBelow: intent === 'after',
      });
      if (!resolved) return;
      index = resolved.insertionIndex;
    }
    await bookmarkStore.getState().moveNode(id, parentId, index);
  };
  return {
    sensors,
    collisionDetection,
    activeNode,
    feedback: { ...hint, dragging: !!activeId },
    dndContextProps: { onDragStart, onDragMove: updateHint, onDragOver: updateHint, onDragEnd, onDragCancel: reset },
  };
};
