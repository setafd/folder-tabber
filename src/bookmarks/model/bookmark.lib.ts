import type { BookmarkNode as Node } from './types';

export const isFolder = (node: Node) => node.type !== 'separator' && node.url === undefined;
export const isBookmark = (node: Node) => node.type !== 'separator' && node.url !== undefined;
export const visibleChildren = (node: Node) =>
  (node.children ?? []).filter((child) => isFolder(child) || isBookmark(child));

export function findBookmark(nodes: Node[], id: string): Node | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = node.children && findBookmark(node.children, id);
    if (found) return found;
  }
}

export function bookmarkPath(nodes: Node[], id: string): Node[] {
  for (const node of nodes) {
    if (node.id === id) return [node];
    const path = node.children && bookmarkPath(node.children, id);
    if (path?.length) return [node, ...path];
  }
  return [];
}

export const resolveMoveIndex = ({
  isSameContainer,
  isBelow,
  oldIndex,
  overIndex,
}: {
  isSameContainer: boolean;
  isBelow: boolean | null;
  oldIndex: number;
  overIndex: number;
}) => {
  if (oldIndex < 0 || overIndex < 0 || (isSameContainer && oldIndex === overIndex)) return null;
  const insertionIndex = overIndex + (isBelow ? 1 : 0);
  const finalIndex = insertionIndex - (isSameContainer && oldIndex < insertionIndex ? 1 : 0);
  return isSameContainer && finalIndex === oldIndex ? null : { insertionIndex, finalIndex };
};
