import { DndContext } from '@dnd-kit/core';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type FolderChildren } from '@/bookmarks';

import { GridFolder } from './GridFolder';

const folder: FolderChildren = {
  id: 'F',
  title: 'Folder',
  children: [
    {
      id: 'nested',
      title: 'Nested',
      children: [{ id: 'B', title: 'Hidden bookmark', url: 'https://example.com' }],
    },
  ],
};
const noop = () => {};
const props = {
  expanded: new Set<string>(),
  showAll: new Set<string>(),
  onToggle: noop,
  onShowAll: noop,
  onClickBookmark: noop,
  onClickCreateButton: noop,
  onClickEditButton: noop,
};
afterEach(cleanup);
describe('nested folders', () => {
  it('renders the folder row without mounting its collapsed subtree', () => {
    const toggle = vi.fn();
    render(
      <DndContext>
        <GridFolder folder={folder} {...props} onToggle={toggle} />
      </DndContext>,
    );
    expect(screen.queryByRole('link', { name: 'Hidden bookmark' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Expand Nested' }));
    expect(toggle).toHaveBeenCalledWith('nested');
  });
  it('uses separate grid and sidebar draggable namespaces, including root views', () => {
    render(
      <DndContext>
        <GridFolder folder={folder} {...props} isRoot />
      </DndContext>,
    );
    expect(screen.queryByRole('button', { name: /Drag Folder/ })).toBeNull();
  });
});
