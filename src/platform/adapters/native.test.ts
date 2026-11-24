import { describe, expect, it, vi } from 'vitest';

import { createChromiumPlatform } from './chromium';
import { createFirefoxPlatform } from './firefox';
import type { NativeBrowser } from './native';

const event = () => ({ addListener: vi.fn(), removeListener: vi.fn() });
const fixture = () => {
  const raw = {
    bookmarks: {
      getTree: vi.fn(async () => [
        {
          id: 'root________',
          title: '',
          children: [
            {
              id: 'toolbar_____',
              title: 'Toolbar',
              url: null,
              type: 'folder',
              children: [
                { id: 'separator', title: '', type: 'separator', url: 'data:' },
                { id: 'link', title: 'Docs', type: 'bookmark', url: 'https://example.com' },
              ],
            },
          ],
        },
      ]),
      getSubTree: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      move: vi.fn(),
      remove: vi.fn(async () => {}),
      removeTree: vi.fn(async () => {}),
      onCreated: event(),
      onRemoved: event(),
      onChanged: event(),
      onMoved: event(),
      onChildrenReordered: event(),
    },
    tabs: {
      getCurrent: vi.fn(async () => ({ id: 1, windowId: 4 })),
      update: vi.fn(async () => ({ id: 1, windowId: 4 })),
      create: vi.fn(async () => ({ id: 2, windowId: 4 })),
      group: vi.fn(async () => 10),
      query: vi.fn(async () => [{ id: 5, url: 'https://example.com', favIconUrl: 'data:image/png;base64,icon' }]),
      onUpdated: event(),
    },
    tabGroups: { query: vi.fn(async () => [] as { id: number }[]), update: vi.fn(async () => ({})) },
    storage: {
      local: {
        get: vi.fn(async () => ({ selection: 'saved' })),
        set: vi.fn(async () => {}),
        remove: vi.fn(async () => {}),
      },
    },
    runtime: { getURL: (path: string) => `chrome-extension://test${path}` },
  };
  return { raw, api: raw as unknown as NativeBrowser };
};

for (const [browser, factory] of [
  ['Chromium', createChromiumPlatform],
  ['Firefox', createFirefoxPlatform],
] as const) {
  describe(`${browser} adapter`, () => {
    it('preserves every final move position in both directions', async () => {
      const original = ['A', 'B', 'C', 'D', 'E'];
      for (let previousIndex = 0; previousIndex < original.length; previousIndex++) {
        for (let index = 0; index < original.length; index++) {
          const { raw, api } = fixture();
          const actual = [...original];
          raw.bookmarks.move.mockImplementation(
            async (id: string, destination: { parentId: string; index: number }) => {
              const source = actual.indexOf(id);
              const nativeIndex =
                browser === 'Chromium' && destination.index > source ? destination.index - 1 : destination.index;
              actual.splice(source, 1);
              actual.splice(nativeIndex, 0, id);
              return { id, title: id, url: 'https://example.com' };
            },
          );
          await factory(api).bookmarks.move(original[previousIndex], {
            parentId: 'parent',
            index,
            previousParentId: 'parent',
            previousIndex,
          });
          const expected = original.filter((_, i) => i !== previousIndex);
          expected.splice(index, 0, original[previousIndex]);
          expect(actual).toEqual(expected);
        }
      }
    });
    it('does not adjust an index when moving between folders', async () => {
      const { raw, api } = fixture();
      raw.bookmarks.move.mockResolvedValue({ id: 'A', title: 'A', url: 'https://example.com' });
      await factory(api).bookmarks.move('A', {
        parentId: 'target',
        index: 2,
        previousParentId: 'source',
        previousIndex: 0,
      });
      expect(raw.bookmarks.move).toHaveBeenCalledWith('A', { parentId: 'target', index: 2 });
    });
    it('normalizes Firefox null folder URLs and preserves separator positions', async () => {
      const { api } = fixture();
      const [root] = await factory(api).bookmarks.getTree();
      expect(root.readOnly).toBe(true);
      expect(root.url).toBeUndefined();
      expect(root.children?.map((node) => node.type)).toEqual(['separator', 'bookmark']);
      expect(root.children?.[0].url).toBeUndefined();
    });
    it('subscribes to bookmark changes and releases every listener', () => {
      const { raw, api } = fixture();
      const callback = vi.fn();
      const unsubscribe = factory(api).bookmarks.subscribe(callback);
      expect(raw.bookmarks.onMoved.addListener).toHaveBeenCalledWith(callback);
      unsubscribe();
      expect(raw.bookmarks.onMoved.removeListener).toHaveBeenCalledWith(callback);
      expect(raw.bookmarks.onChildrenReordered.removeListener).toHaveBeenCalledWith(callback);
    });
    it('opens background tabs and reuses a group only in their window', async () => {
      const { raw, api } = fixture();
      raw.tabGroups.query.mockResolvedValue([{ id: 8 }]);
      await factory(api).tabs.open('https://example.com', 'Work', false);
      expect(raw.tabs.create).toHaveBeenCalledWith({ url: 'https://example.com', active: false });
      expect(raw.tabGroups.query).toHaveBeenCalledWith({ title: 'Work', windowId: 4 });
      expect(raw.tabs.group).toHaveBeenCalledWith({ tabIds: [2], groupId: 8 });
    });
    it('opens the current tab and names a newly created group', async () => {
      const { raw, api } = fixture();
      await factory(api).tabs.open('https://example.com', 'Work', true);
      expect(raw.tabs.update).toHaveBeenCalledWith(1, { url: 'https://example.com' });
      expect(raw.tabs.create).not.toHaveBeenCalled();
      expect(raw.tabs.group).toHaveBeenCalledWith({ tabIds: [1] });
      expect(raw.tabGroups.update).toHaveBeenCalledWith(10, { title: 'Work' });
    });
    it('tolerates a browser that does not expose the reorder event', () => {
      const { raw, api } = fixture();
      Reflect.deleteProperty(raw.bookmarks, 'onChildrenReordered');
      const unsubscribe = factory(api).bookmarks.subscribe(() => {});
      expect(unsubscribe).not.toThrow();
    });
    it('still navigates the current tab when grouping fails', async () => {
      const { raw, api } = fixture();
      raw.tabGroups.query.mockRejectedValue(new Error('Groups unavailable'));
      await expect(factory(api).tabs.open('https://example.com', 'Work', true)).rejects.toThrow('Groups unavailable');
      expect(raw.tabs.update).toHaveBeenCalledWith(1, { url: 'https://example.com' });
    });
    it('propagates write errors to the application', async () => {
      const { raw, api } = fixture();
      raw.bookmarks.move.mockRejectedValue(new Error('Read-only folder'));
      await expect(
        factory(api).bookmarks.move('A', {
          parentId: 'target',
          index: 0,
          previousParentId: 'source',
          previousIndex: 0,
        }),
      ).rejects.toThrow('Read-only folder');
    });
  });
}

describe('browser favicon sources', () => {
  it('uses the Chromium favicon endpoint with the bookmark URL encoded', () => {
    const { api } = fixture();
    const icons = createChromiumPlatform(api).favicons;
    const url = new URL(icons.getUrl('https://example.com/path?q=1'));
    expect(url.pathname).toBe('/_favicon/');
    expect(url.searchParams.get('pageUrl')).toBe('https://example.com/path?q=1');
  });
  it('uses open-tab icons in Firefox and a local fallback for unknown URLs', async () => {
    const { raw, api } = fixture();
    const icons = createFirefoxPlatform(api).favicons;
    expect(icons.getUrl('https://unknown.example')).toBe(icons.fallback);
    const changed = vi.fn();
    const unsubscribe = icons.subscribe(changed);
    await vi.waitFor(() => expect(changed).toHaveBeenCalled());
    expect(icons.getUrl('https://example.com')).toBe('data:image/png;base64,icon');
    expect(raw.tabs.onUpdated.addListener).toHaveBeenCalledOnce();
    unsubscribe();
    expect(raw.tabs.onUpdated.removeListener).toHaveBeenCalledOnce();
  });
});
