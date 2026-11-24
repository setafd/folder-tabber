import { type CollisionDetection, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { type FolderChildren, bookmarkStore } from '@entities/bookmark';

import { type DropData } from '@shared/lib/dnd';

import { dropIntent, useAppDnd } from './app.dnd';

const bm = (id: string): FolderChildren => ({
  id,
  title: id,
  url: 'https://example.com',
  syncing: false,
  parentId: 'selected',
});
const tree: FolderChildren[] = [
  {
    id: '1',
    title: 'Root',
    syncing: false,
    parentId: '0',
    children: [
      {
        id: 'selected',
        title: 'Selected',
        syncing: false,
        parentId: '1',
        children: [
          bm('A'),
          bm('B'),
          bm('C'),
          {
            id: 'F',
            title: 'Folder',
            parentId: 'selected',
            syncing: false,
            children: [{ id: 'Nested', title: 'Nested', syncing: false, parentId: 'F', children: [] }],
          },
        ],
      },
      { id: 'other', title: 'Other', parentId: '1', syncing: false, children: [] },
    ],
  },
];
const move = vi.fn(async () => true);
const active = { id: 'drag:grid:A', data: { current: { nodeId: 'A' } } };
function collisionArgs(data: DropData, point = { x: 50, y: 110 }, source = active) {
  const rect = { top: 100, left: 0, width: 200, height: 36, right: 200, bottom: 136 };
  const container = { id: 'target', data: { current: data }, rect: { current: rect } };
  return {
    active: source,
    pointerCoordinates: point,
    collisionRect: rect,
    droppableRects: new Map([['target', rect]]),
    droppableContainers: [container],
  } as unknown as Parameters<CollisionDetection>[0];
}
const end = (source = active) => ({ active: source, over: { id: 'target' } }) as unknown as DragEndEvent;
beforeAll(async () => {
  await bookmarkStore.persist.rehydrate();
});
beforeEach(() => {
  move.mockClear();
  bookmarkStore.setState({ tree, moveNode: move, isLoading: false, isMoving: false, error: null });
});
afterEach(cleanup);
describe('pointer DnD', () => {
  it('cancels drops outside every target', async () => {
    const { result } = renderHook(useAppDnd);
    expect(
      result.current.collisionDetection(
        collisionArgs({ type: 'item', nodeId: 'B', parentId: 'selected' }, { x: 900, y: 900 }),
      ),
    ).toEqual([]);
    await act(() => result.current.dndContextProps.onDragEnd(end()));
    expect(move).not.toHaveBeenCalled();
  });
  it('uses the release half even if the pointer stayed on the same overId', async () => {
    const { result } = renderHook(useAppDnd);
    const data: DropData = { type: 'item', nodeId: 'B', parentId: 'selected', isFolder: false };
    result.current.collisionDetection(collisionArgs(data, { x: 50, y: 104 }));
    act(() => result.current.dndContextProps.onDragOver());
    result.current.collisionDetection(collisionArgs(data, { x: 50, y: 132 }));
    await act(() => result.current.dndContextProps.onDragEnd(end()));
    expect(move).toHaveBeenCalledWith('A', 'selected', 2);
  });
  it('inserts before the target using the raw mixed-child index', async () => {
    const { result } = renderHook(useAppDnd);
    result.current.collisionDetection(collisionArgs({ type: 'item', nodeId: 'F', isFolder: true }, { x: 50, y: 102 }));
    await act(() => result.current.dndContextProps.onDragEnd(end()));
    expect(move).toHaveBeenCalledWith('A', 'selected', 3);
  });
  it('puts folders inside sidebar folders, just like bookmarks', async () => {
    const { result } = renderHook(useAppDnd);
    const source = { id: 'drag:grid:F', data: { current: { nodeId: 'F' } } };
    result.current.collisionDetection(
      collisionArgs({ type: 'item', nodeId: 'other', isFolder: true }, { x: 50, y: 118 }, source),
    );
    await act(() => result.current.dndContextProps.onDragEnd(end(source)));
    expect(move).toHaveBeenCalledWith('F', 'other', 0);
  });
  it('appends at exactly the container length', async () => {
    const { result } = renderHook(useAppDnd);
    result.current.collisionDetection(collisionArgs({ type: 'container', nodeId: 'selected' }));
    await act(() => result.current.dndContextProps.onDragEnd(end()));
    expect(move).toHaveBeenCalledWith('A', 'selected', 4);
  });
  it('excludes URL nodes from container candidates', () => {
    const { result } = renderHook(useAppDnd);
    expect(result.current.collisionDetection(collisionArgs({ type: 'container', nodeId: 'B' }))).toEqual([]);
  });
  it('excludes the active node and its descendants', () => {
    const { result } = renderHook(useAppDnd);
    const source = { id: 'drag:grid:F', data: { current: { nodeId: 'F' } } };
    for (const id of ['F', 'Nested'])
      expect(
        result.current.collisionDetection(collisionArgs({ type: 'container', nodeId: id }, { x: 50, y: 118 }, source)),
      ).toEqual([]);
  });
  it('does not fall through a self drop to the containing folder', () => {
    const { result } = renderHook(useAppDnd);
    const args = collisionArgs({ type: 'item', nodeId: 'A' });
    const container = args.droppableContainers[0];
    args.droppableContainers.push({
      ...container,
      id: 'ancestor',
      data: { current: { type: 'container', nodeId: 'selected' } },
    });
    args.droppableRects.set('ancestor', args.droppableRects.get('target')!);
    expect(result.current.collisionDetection(args)).toEqual([]);
  });
  it('clears feedback and prevents a move after cancellation', async () => {
    const { result } = renderHook(useAppDnd);
    act(() => result.current.dndContextProps.onDragStart({ active } as unknown as DragStartEvent));
    expect(result.current.activeNode?.id).toBe('A');
    result.current.collisionDetection(collisionArgs({ type: 'item', nodeId: 'B' }));
    act(() => result.current.dndContextProps.onDragCancel());
    await act(() => result.current.dndContextProps.onDragEnd(end()));
    expect(result.current.activeNode).toBeUndefined();
    expect(move).not.toHaveBeenCalled();
  });
  it('makes card side edges explicit reorder targets', () => {
    const rect = { top: 0, left: 0, width: 300, height: 44 };
    const data: DropData = { type: 'item', nodeId: 'F', isFolder: true, layout: 'card' };
    expect(dropIntent(data, { x: 4, y: 22 }, rect)).toBe('before');
    expect(dropIntent(data, { x: 296, y: 22 }, rect)).toBe('after');
    expect(dropIntent(data, { x: 150, y: 22 }, rect)).toBe('inside');
  });
});
