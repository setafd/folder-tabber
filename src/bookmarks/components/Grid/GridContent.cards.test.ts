import { describe, expect, it } from 'vitest';

import { type FolderChildren } from '@/bookmarks';

import { folderCardLayout } from './GridContent.cards';

const link = (id: string): FolderChildren => ({ id, title: id, url: 'https://example.com' });
const folder: FolderChildren = {
  id: 'card',
  title: 'Card',
  children: [
    ...Array.from({ length: 6 }, (_, index) => link(`before${index}`)),
    {
      id: 'branch',
      title: 'Branch',
      children: Array.from({ length: 20 }, (_, index) => link(`child${index}`)),
    },
    ...Array.from({ length: 9 }, (_, index) => link(`after${index}`)),
  ],
};

describe('stable folder columns', () => {
  it('keeps sibling membership and packing dimensions when a branch opens', () => {
    const closed = folderCardLayout(folder, new Set(), false);
    const opened = folderCardLayout(folder, new Set(['branch']), false);
    expect(opened.split).toBe(closed.split);
    expect(opened.children.slice(0, opened.split).map((node) => node.id)).toEqual(
      closed.children.slice(0, closed.split).map((node) => node.id),
    );
    expect(opened.baseNarrowHeight).toBe(closed.baseNarrowHeight);
    expect(opened.baseWideHeight).toBe(closed.baseWideHeight);
    expect(opened.narrowHeight).toBeGreaterThan(closed.narrowHeight);
    expect(opened.wideHeight).toBeGreaterThan(closed.wideHeight);
  });
});

it('does not reserve layout space for Firefox separators inside expanded folders', () => {
  const nested: FolderChildren = {
    id: 'nested-with-separator',
    title: 'Nested',
    children: [
      { id: 'separator', title: '', type: 'separator' },
      { id: 'link', title: 'Docs', url: 'https://example.com' },
    ],
  };
  const folder: FolderChildren = { id: 'folder-with-separator', title: 'Folder', children: [nested] };
  const collapsed = folderCardLayout(folder, new Set(), false);
  const expanded = folderCardLayout(folder, new Set([nested.id]), false);
  expect(expanded.narrowHeight - collapsed.narrowHeight).toBe(36);
});
