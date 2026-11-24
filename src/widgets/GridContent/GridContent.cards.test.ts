import { describe, expect, it } from 'vitest';

import { type FolderChildren } from '@entities/bookmark';

import { folderCardLayout } from './GridContent.cards';

const link = (id: string): FolderChildren => ({ id, title: id, syncing: false, url: 'https://example.com' });
const folder: FolderChildren = {
  id: 'card',
  title: 'Card',
  syncing: false,
  children: [
    ...Array.from({ length: 6 }, (_, index) => link(`before${index}`)),
    {
      id: 'branch',
      title: 'Branch',
      syncing: false,
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
