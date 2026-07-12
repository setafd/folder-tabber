import { DndContext } from '@dnd-kit/core';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { FolderChildren } from '@entities/bookmark';

import { GridFolder } from './GridFolder';

// Spy on the real useDraggable so its behavior is untouched but we can inspect what id it was
// called with — that id is the thing this regression actually guards.
vi.mock('@dnd-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/core')>();
  return { ...actual, useDraggable: vi.fn(actual.useDraggable) };
});

const noop = () => {};

const folder: FolderChildren = {
  id: '93',
  title: 'Group 7',
  syncing: false,
  children: [],
};

describe('GridFolder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers its inert root-card draggable under a container-prefixed id, never the raw folder id', async () => {
    const { useDraggable } = await import('@dnd-kit/core');

    render(
      <DndContext>
        <GridFolder folder={folder} isRoot onClickBookmark={noop} onClickCreateButton={noop} onClickEditButton={noop} />
      </DndContext>,
    );

    // The root card's folder id is the currently selected folder's real id — the exact same
    // id the Sidebar uses for that folder's own (real, activatable) draggable entry. If this
    // ever regresses to the raw id, the two collide in dnd-kit's shared draggable registry
    // and dnd-kit can measure the wrong DOM node as the active drag rect (see GridFolder.tsx).
    expect(useDraggable).toHaveBeenCalledWith(expect.objectContaining({ id: 'container:93' }));
    expect(useDraggable).not.toHaveBeenCalledWith(expect.objectContaining({ id: '93' }));
  });

  it('registers a non-root folder card draggable under its own raw id (no collision risk)', async () => {
    const { useDraggable } = await import('@dnd-kit/core');

    render(
      <DndContext>
        <GridFolder folder={folder} onClickBookmark={noop} onClickCreateButton={noop} onClickEditButton={noop} />
      </DndContext>,
    );

    expect(useDraggable).toHaveBeenCalledWith(expect.objectContaining({ id: '93' }));
  });
});
