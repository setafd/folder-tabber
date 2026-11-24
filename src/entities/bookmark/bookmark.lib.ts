type Node = chrome.bookmarks.BookmarkTreeNode;

export const isFolder = (node: Node) => node.url === undefined;

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
  const apiIndex = overIndex + (isBelow ? 1 : 0);
  const localIndex = apiIndex - (isSameContainer && oldIndex < apiIndex ? 1 : 0);
  return isSameContainer && localIndex === oldIndex ? null : { apiIndex, localIndex };
};
