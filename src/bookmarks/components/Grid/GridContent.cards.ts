import { type FolderChildren, isFolder, visibleChildren } from '@/bookmarks';
import { GRID_CARD_CHROME, GRID_ROW_HEIGHT } from '@/bookmarks/layout/config';

export const PREVIEW_COUNT = 24;
export function visibleRows(node: FolderChildren, expanded: ReadonlySet<string>): number {
  return (
    1 +
    (isFolder(node) && expanded.has(node.id)
      ? visibleChildren(node).reduce((sum, child) => sum + visibleRows(child, expanded), 0)
      : 0)
  );
}

export function folderCardLayout(folder: FolderChildren, expanded: ReadonlySet<string>, showAll: boolean) {
  const all = visibleChildren(folder);
  const children = showAll ? all : all.slice(0, PREVIEW_COUNT);
  const heights = children.map((node) => visibleRows(node, expanded) * GRID_ROW_HEIGHT);
  const total = heights.reduce((a, b) => a + b, 0);
  const split = Math.ceil(children.length / 2);
  const firstColumn = heights.slice(0, split).reduce((sum, height) => sum + height, 0);
  const largest = Math.max(firstColumn, total - firstColumn);
  const chrome = GRID_CARD_CHROME + (all.length > PREVIEW_COUNT ? GRID_ROW_HEIGHT : 0);
  return {
    id: folder.id,
    children,
    split,
    narrowHeight: chrome + total,
    wideHeight: chrome + largest,
    baseNarrowHeight: chrome + children.length * GRID_ROW_HEIGHT,
    baseWideHeight: chrome + split * GRID_ROW_HEIGHT,
  };
}
