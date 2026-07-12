import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import { act, renderHook } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { type FolderChildren, type TopLevelFolder, bookmarkStore, moveBookmark } from '@entities/bookmark';

import { useAppDnd } from './app.dnd';

vi.mock('@entities/bookmark', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@entities/bookmark')>();
  return { ...actual, moveBookmark: vi.fn() };
});

const moveBookmarkMock = vi.mocked(moveBookmark);

function makeFolders(): TopLevelFolder[] {
  return [
    {
      id: 'root1',
      title: 'Bookmarks bar',
      children: [
        { id: 'fA', title: 'Folder A', index: 0 },
        { id: 'fB', title: 'Folder B', index: 1 },
      ],
    },
    {
      id: 'root2',
      title: 'Other bookmarks',
      children: [{ id: 'fC', title: 'Folder C', index: 0 }],
    },
  ];
}

function makeRawChildren(): FolderChildren[] {
  return [
    { id: 'bm1', title: 'Bookmark 1', url: 'https://a.example', syncing: false },
    {
      id: 'g1',
      title: 'Group One',
      syncing: false,
      children: [
        { id: 'bm2', title: 'Bookmark 2', url: 'https://b.example', syncing: false },
        {
          id: 'g2',
          title: 'Group Two',
          syncing: false,
          children: [{ id: 'bm4', title: 'Bookmark 4', url: 'https://d.example', syncing: false }],
        },
      ],
    },
    { id: 'bm3', title: 'Bookmark 3', url: 'https://c.example', syncing: false },
  ];
}

const dragStartEvent = (activeId: string): DragStartEvent => ({ active: { id: activeId } }) as unknown as DragStartEvent;

const dragOverEvent = (
  translated: { top: number; height: number } | null,
  over: { id: string; rect: { top: number; height: number } },
): DragOverEvent =>
  ({
    active: { rect: { current: { translated } } },
    over: { id: over.id, rect: over.rect, disabled: false, data: { current: undefined } },
  }) as unknown as DragOverEvent;

const dragEndEvent = (activeId: string, over: { id: string; data?: unknown } | null): DragEndEvent =>
  ({
    active: { id: activeId, data: { current: undefined }, rect: { current: { initial: null, translated: null } } },
    over: over ? { id: over.id, disabled: false, rect: {}, data: { current: over.data } } : null,
  }) as unknown as DragEndEvent;

describe('useAppDnd', () => {
  beforeAll(async () => {
    await bookmarkStore.persist.rehydrate();
  });

  beforeEach(() => {
    moveBookmarkMock.mockClear();
    bookmarkStore.setState({
      folders: makeFolders(),
      folderChildrenRaw: makeRawChildren(),
      folderChildrens: [],
      selectedFolder: { id: 'sel', title: 'Selected' },
      fetchFolders: vi.fn(async () => {}),
      fetchFolderChildrens: vi.fn(),
    });
  });

  it('reorders a bookmark within the same grid container', () => {
    const { result } = renderHook(() => useAppDnd());

    act(() => {
      result.current.dndContextProps.onDragEnd(
        dragEndEvent('bm3', { id: 'bm1', data: { type: 'item', parentId: 'sel', isFolder: false } }),
      );
    });

    expect(moveBookmarkMock).toHaveBeenCalledWith('bm3', { parentId: 'sel', index: 0 });
  });

  it('is a no-op when a bookmark is dropped on itself', () => {
    const { result } = renderHook(() => useAppDnd());

    act(() => {
      result.current.dndContextProps.onDragEnd(
        dragEndEvent('bm1', { id: 'bm1', data: { type: 'item', parentId: 'sel', isFolder: false } }),
      );
    });

    expect(moveBookmarkMock).not.toHaveBeenCalled();
  });

  it('appends a bookmark into a grid folder dropped on its container', () => {
    const { result } = renderHook(() => useAppDnd());

    act(() => {
      result.current.dndContextProps.onDragEnd(
        dragEndEvent('bm1', { id: 'container:g1', data: { type: 'container', parentId: 'g1' } }),
      );
    });

    expect(moveBookmarkMock).toHaveBeenCalledWith('bm1', { parentId: 'g1', index: 2 });
  });

  it('nests a bookmark into a sidebar folder row without guessing an index (regression: was defaulting to 0)', () => {
    const { result } = renderHook(() => useAppDnd());

    act(() => {
      result.current.dndContextProps.onDragEnd(
        dragEndEvent('bm3', { id: 'fB', data: { type: 'item', parentId: 'root1', isFolder: true } }),
      );
    });

    expect(moveBookmarkMock).toHaveBeenCalledWith('bm3', { parentId: 'fB' });
    expect(moveBookmarkMock.mock.calls[0][1]).not.toHaveProperty('index');
  });

  it('reorders a folder within the same sidebar root', () => {
    const { result } = renderHook(() => useAppDnd());

    act(() => {
      result.current.dndContextProps.onDragEnd(
        dragEndEvent('fB', { id: 'fA', data: { type: 'item', parentId: 'root1', isFolder: true } }),
      );
    });

    expect(moveBookmarkMock).toHaveBeenCalledWith('fB', { parentId: 'root1', index: 0 });
  });

  it('refuses to drop a folder into itself', () => {
    const { result } = renderHook(() => useAppDnd());

    act(() => {
      result.current.dndContextProps.onDragEnd(
        dragEndEvent('g1', { id: 'container:g1', data: { type: 'container', parentId: 'g1' } }),
      );
    });

    expect(moveBookmarkMock).not.toHaveBeenCalled();
  });

  it('refuses to drop a folder into its own descendant', () => {
    const { result } = renderHook(() => useAppDnd());

    act(() => {
      result.current.dndContextProps.onDragEnd(
        dragEndEvent('g1', { id: 'container:g2', data: { type: 'container', parentId: 'g2' } }),
      );
    });

    expect(moveBookmarkMock).not.toHaveBeenCalled();
  });

  it('does nothing when dropped with no target', () => {
    const { result } = renderHook(() => useAppDnd());

    act(() => {
      result.current.dndContextProps.onDragEnd(dragEndEvent('bm1', null));
    });

    expect(moveBookmarkMock).not.toHaveBeenCalled();
  });

  it('does nothing when the dragged id cannot be resolved to a source container', () => {
    const { result } = renderHook(() => useAppDnd());

    act(() => {
      result.current.dndContextProps.onDragEnd(
        dragEndEvent('unknown-id', { id: 'bm1', data: { type: 'item', parentId: 'sel', isFolder: false } }),
      );
    });

    expect(moveBookmarkMock).not.toHaveBeenCalled();
  });

  it('refetches folders (and grid children, since a folder is selected) after a successful move', () => {
    const { result } = renderHook(() => useAppDnd());
    const { fetchFolders, fetchFolderChildrens } = bookmarkStore.getState();

    act(() => {
      result.current.dndContextProps.onDragEnd(
        dragEndEvent('bm3', { id: 'bm1', data: { type: 'item', parentId: 'sel', isFolder: false } }),
      );
    });

    expect(fetchFolders).toHaveBeenCalledTimes(1);
    expect(fetchFolderChildrens).toHaveBeenCalledTimes(1);
  });

  it('feeds onDragOver rect math into the index resolved on drop', () => {
    const { result } = renderHook(() => useAppDnd());

    act(() => {
      result.current.dndContextProps.onDragOver(
        dragOverEvent({ top: 0, height: 10 }, { id: 'bm1', rect: { top: 100, height: 10 } }),
      );
    });
    act(() => {
      result.current.dndContextProps.onDragEnd(
        dragEndEvent('bm3', { id: 'bm1', data: { type: 'item', parentId: 'sel', isFolder: false } }),
      );
    });

    expect(moveBookmarkMock).toHaveBeenCalledWith('bm3', { parentId: 'sel', index: 2 });
  });

  it('tracks the active node through the drag lifecycle and clears it on cancel', () => {
    const { result } = renderHook(() => useAppDnd());

    expect(result.current.activeNode).toBeUndefined();

    act(() => {
      result.current.dndContextProps.onDragStart(dragStartEvent('bm1'));
    });
    expect(result.current.activeNode).toMatchObject({ id: 'bm1', title: 'Bookmark 1', isFolder: false });

    act(() => {
      result.current.dndContextProps.onDragCancel();
    });
    expect(result.current.activeNode).toBeUndefined();
    expect(moveBookmarkMock).not.toHaveBeenCalled();
  });
});
