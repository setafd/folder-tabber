import type { BookmarkNode } from '@/bookmarks/model/types';

import fallback from './assets/bookmark.svg';
import type { BrowserPlatform } from './contracts';

export function createMockPlatform(): BrowserPlatform {
  let sequence = 0;
  const listeners = new Set<() => void>();
  const folder = (title: string, children: BookmarkNode[] = []): BookmarkNode => ({
    id: String(++sequence),
    title,
    type: 'folder',
    children,
  });
  const link = (title: string, url: string): BookmarkNode => ({ id: String(++sequence), title, type: 'bookmark', url });
  const tree = [
    folder('Bookmarks bar', [
      folder('Workspace', [
        folder('Frontend', [
          link('React documentation', 'https://react.dev/learn'),
          link('TypeScript handbook', 'https://www.typescriptlang.org/docs/'),
          folder('UI patterns', [
            link('Radix Primitives', 'https://www.radix-ui.com/'),
            link('Accessibility checklist', 'https://www.a11yproject.com/checklist/'),
          ]),
          link('Vite guide', 'https://vite.dev/guide/'),
        ]),
        folder('Design', [link('Figma', 'https://www.figma.com/'), link('Google Fonts', 'https://fonts.google.com/')]),
        folder('Reading list', [
          link('Smashing Magazine', 'https://www.smashingmagazine.com/'),
          link('MDN Web Docs', 'https://developer.mozilla.org/'),
        ]),
      ]),
      folder('Personal'),
    ]),
    folder('Other bookmarks', [folder('Archive')]),
  ];
  tree.forEach((node) => {
    node.readOnly = true;
  });
  const normalize = (nodes: BookmarkNode[], parentId?: string) =>
    nodes.forEach((node, index) => {
      node.parentId = parentId;
      node.index = index;
      if (node.children) normalize(node.children, node.id);
    });
  normalize(tree);
  const find = (id: string, nodes = tree): BookmarkNode | undefined => {
    for (const node of nodes) {
      if (node.id === id) return node;
      const child = node.children && find(id, node.children);
      if (child) return child;
    }
  };
  const get = (id: string) => {
    const node = find(id);
    if (!node) throw new Error(`Bookmark ${id} not found`);
    return node;
  };
  const children = (id: string) => {
    const node = get(id);
    if (!node.children) throw new Error('The destination must be a folder');
    return node.children;
  };
  const notify = () => {
    normalize(tree);
    listeners.forEach((listener) => listener());
  };
  const remove = (id: string) => {
    const node = get(id);
    if (node.readOnly || !node.parentId) throw new Error('Cannot remove a root folder');
    const siblings = children(node.parentId);
    siblings.splice(
      siblings.findIndex((child) => child.id === id),
      1,
    );
    notify();
  };
  return {
    bookmarks: {
      getTree: async () => structuredClone(tree),
      getSubTree: async (id) => structuredClone([get(id)]),
      create: async (details) => {
        const node = details.url ? link(details.title ?? '', details.url) : folder(details.title ?? '');
        const siblings = children(details.parentId);
        const index = details.index ?? siblings.length;
        if (index < 0 || index > siblings.length) throw new Error('Invalid index');
        siblings.splice(index, 0, node);
        notify();
        return structuredClone(node);
      },
      update: async (id, changes) => {
        const node = get(id);
        if (node.readOnly) throw new Error('Cannot rename a root folder');
        Object.assign(node, changes);
        notify();
        return structuredClone(node);
      },
      move: async (id, destination) => {
        const node = get(id);
        if (node.readOnly || !node.parentId) throw new Error('Cannot move a root folder');
        if (find(destination.parentId, [node])) throw new Error('Cannot move a folder into itself');
        const target = children(destination.parentId);
        const source = children(node.parentId);
        const oldIndex = source.findIndex((child) => child.id === id);
        const max = target.length - (target === source ? 1 : 0);
        if (destination.index < 0 || destination.index > max) throw new Error('Invalid index');
        source.splice(oldIndex, 1);
        target.splice(destination.index, 0, node);
        notify();
        return structuredClone(node);
      },
      remove: async (id) => {
        if (get(id).children?.length) throw new Error('Cannot remove a non-empty folder');
        remove(id);
      },
      removeTree: async (id) => remove(id),
      subscribe: (listener) => {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
    },
    storage: {
      getItem: async (name) => localStorage.getItem(name),
      setItem: async (name, value) => {
        localStorage.setItem(name, value);
      },
      removeItem: async (name) => {
        localStorage.removeItem(name);
      },
    },
    tabs: { open: async () => {} },
    favicons: { fallback, getUrl: () => fallback, subscribe: () => () => {} },
  };
}
