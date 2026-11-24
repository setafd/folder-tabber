import type { BookmarkKind, BookmarkNode } from '@/bookmarks/model/types';

import fallback from '../assets/bookmark.svg';
import type { BrowserPlatform } from '../contracts';

export type NativeBrowser = Pick<typeof chrome, 'bookmarks' | 'tabs' | 'tabGroups' | 'storage' | 'runtime'>;
type NativeBookmark = chrome.bookmarks.BookmarkTreeNode & { type?: BookmarkKind };
type NativeOptions = { moveIndex: 'before-removal' | 'after-removal'; favicons: 'chromium' | 'tabs' };

export function normalizeBookmark(node: NativeBookmark, root = false): BookmarkNode {
  const type = node.type ?? (typeof node.url === 'string' ? 'bookmark' : 'folder');
  return {
    id: node.id,
    title: node.title,
    parentId: node.parentId,
    index: node.index,
    type,
    readOnly: root || !!node.unmodifiable,
    ...(type === 'bookmark' && typeof node.url === 'string' ? { url: node.url } : {}),
    ...(type === 'folder' ? { children: (node.children ?? []).map((child) => normalizeBookmark(child)) } : {}),
  };
}

function createFavicons(api: NativeBrowser, source: NativeOptions['favicons']): BrowserPlatform['favicons'] {
  const icons = new Map<string, string>();
  const listeners = new Set<() => void>();
  const remember = (tab: chrome.tabs.Tab) => {
    if (!tab.url || !tab.favIconUrl || icons.get(tab.url) === tab.favIconUrl) return;
    icons.set(tab.url, tab.favIconUrl);
    listeners.forEach((listener) => listener());
  };
  const onUpdated = (_id: number, _change: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => remember(tab);
  return {
    fallback,
    getUrl: (url) => {
      if (source === 'tabs') return icons.get(url) ?? fallback;
      const icon = new URL(api.runtime.getURL('/_favicon/'));
      icon.searchParams.set('pageUrl', url);
      icon.searchParams.set('size', '16');
      return icon.toString();
    },
    subscribe: (listener) => {
      if (source === 'chromium') return () => {};
      listeners.add(listener);
      if (listeners.size === 1) {
        api.tabs.onUpdated.addListener(onUpdated);
        void api.tabs
          .query({})
          .then((tabs) => tabs.forEach(remember))
          .catch(() => {});
      }
      return () => {
        listeners.delete(listener);
        if (!listeners.size) api.tabs.onUpdated.removeListener(onUpdated);
      };
    },
  };
}

export function createNativePlatform(api: NativeBrowser, options: NativeOptions): BrowserPlatform {
  return {
    bookmarks: {
      getTree: async () =>
        ((await api.bookmarks.getTree())[0]?.children ?? []).map((node) => normalizeBookmark(node, true)),
      getSubTree: async (id) => (await api.bookmarks.getSubTree(id)).map((node) => normalizeBookmark(node)),
      create: async (details) => normalizeBookmark(await api.bookmarks.create(details)),
      update: async (id, changes) => normalizeBookmark(await api.bookmarks.update(id, changes)),
      move: async (id, destination) => {
        const { parentId, index, previousParentId, previousIndex } = destination;
        const nativeIndex =
          options.moveIndex === 'before-removal' && parentId === previousParentId && index > previousIndex
            ? index + 1
            : index;
        return normalizeBookmark(await api.bookmarks.move(id, { parentId, index: nativeIndex }));
      },
      remove: (id) => api.bookmarks.remove(id),
      removeTree: (id) => api.bookmarks.removeTree(id),
      subscribe: (listener) => {
        const events = [
          api.bookmarks.onCreated,
          api.bookmarks.onRemoved,
          api.bookmarks.onChanged,
          api.bookmarks.onMoved,
          api.bookmarks.onChildrenReordered,
        ];
        events.forEach((event) => event?.addListener(listener));
        return () => events.forEach((event) => event?.removeListener(listener));
      },
    },
    storage: {
      getItem: async (name) => {
        const value = (await api.storage.local.get([name]))[name];
        return typeof value === 'string' ? value : null;
      },
      setItem: (name, value) => api.storage.local.set({ [name]: value }),
      removeItem: (name) => api.storage.local.remove(name),
    },
    tabs: {
      open: async (url, groupTitle, inCurrent) => {
        const tab = inCurrent ? await api.tabs.getCurrent() : await api.tabs.create({ url, active: false });
        if (tab?.id === undefined) return;
        try {
          if (!api.tabGroups?.query || !api.tabs.group) return;
          const [group] = await api.tabGroups.query({ title: groupTitle, windowId: tab.windowId });
          if (group) {
            await api.tabs.group({ tabIds: [tab.id], groupId: group.id });
          } else {
            const groupId = await api.tabs.group({ tabIds: [tab.id] });
            await api.tabGroups.update(groupId, { title: groupTitle });
          }
        } finally {
          if (inCurrent) await api.tabs.update(tab.id, { url });
        }
      },
    },
    favicons: createFavicons(api, options.favicons),
  };
}
