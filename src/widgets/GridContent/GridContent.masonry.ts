import { useCallback, useLayoutEffect, useRef, useState } from 'react';

export interface MasonryLayoutOptions {
  /** Precondition: >= 1. The caller (the measurement hook) is responsible for clamping this. */
  columnCount: number;
  cardWidth: number;
  gap: number;
}

export interface MasonryLayoutResult {
  /** Same order as the input `heights` array. */
  positions: { top: number; left: number }[];
  containerHeight: number;
}

/**
 * Greedy shortest-column bin-packing: places each card (in input order) into whichever
 * column is currently shortest, ties going to the leftmost column. Input order is
 * preserved deliberately (unlike a `grid-auto-flow: dense` backfill) so visual position
 * keeps matching the underlying data order.
 */
export const computeMasonryLayout = (heights: number[], { columnCount, cardWidth, gap }: MasonryLayoutOptions): MasonryLayoutResult => {
  const columnHeights = new Array<number>(columnCount).fill(0);
  const positions = heights.map((height) => {
    const col = columnHeights.indexOf(Math.min(...columnHeights));
    const top = columnHeights[col];
    const left = col * (cardWidth + gap);

    columnHeights[col] += height + gap;

    return { top, left };
  });

  const containerHeight = Math.max(0, Math.max(...columnHeights) - gap);

  return { positions, containerHeight };
};

export interface MasonryItemPosition {
  top: number;
  left: number;
}

/**
 * Measures each registered card, runs `computeMasonryLayout`, and hands back per-id
 * positions. Reads and writes are kept in separate passes: `recompute` only reads
 * (`getBoundingClientRect`) across every card before computing anything, and the result is
 * applied via a single state update rather than looping through elements setting styles —
 * React commits every wrapper's new position together in one pass.
 */
export const useMasonryLayout = (items: { id: string }[], { cardWidth, gap }: { cardWidth: number; gap: number }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef(new Map<string, HTMLElement>());
  const registerCallbacks = useRef(new Map<string, (element: HTMLElement | null) => void>());

  const [columnCount, setColumnCount] = useState(1);
  const [positions, setPositions] = useState(new Map<string, MasonryItemPosition>());
  const [containerHeight, setContainerHeight] = useState(0);

  const recompute = useCallback(() => {
    const heights = items.map((item) => itemRefs.current.get(item.id)?.getBoundingClientRect().height ?? 0);

    const { positions: computed, containerHeight: nextHeight } = computeMasonryLayout(heights, {
      columnCount,
      cardWidth,
      gap,
    });

    setPositions(new Map(items.map((item, index) => [item.id, computed[index]])));
    setContainerHeight(nextHeight);
  }, [items, columnCount, cardWidth, gap]);

  // Lets the content-resize effect below always call the latest `recompute` without needing
  // it in its own dependency array, so it doesn't tear down and recreate its ResizeObserver
  // on every column-count change (e.g. every window resize) — only when the set of cards
  // actually changes.
  const recomputeRef = useRef(recompute);
  useLayoutEffect(() => {
    recomputeRef.current = recompute;
  }, [recompute]);

  // Column count depends on the container's available width, which only the browser knows.
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateColumnCount = () => {
      const width = container.getBoundingClientRect().width;
      setColumnCount(Math.max(1, Math.floor((width + gap) / (cardWidth + gap))));
    };

    updateColumnCount();
    const observer = new ResizeObserver(updateColumnCount);
    observer.observe(container);
    return () => observer.disconnect();
  }, [cardWidth, gap]);

  // Re-run the full layout whenever the set of cards or the column count changes.
  useLayoutEffect(() => {
    recompute();
  }, [recompute]);

  // Re-run whenever any card's own content height changes (a bookmark added/edited/removed
  // inside it). A single shared ResizeObserver across every card naturally coalesces
  // simultaneous height changes into one callback/recompute, rather than one per card.
  useLayoutEffect(() => {
    const observer = new ResizeObserver(() => recomputeRef.current());
    itemRefs.current.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [items]);

  const registerItem = useCallback((id: string) => {
    let callback = registerCallbacks.current.get(id);
    if (!callback) {
      callback = (element: HTMLElement | null) => {
        if (element) {
          itemRefs.current.set(id, element);
        } else {
          itemRefs.current.delete(id);
          registerCallbacks.current.delete(id);
        }
      };
      registerCallbacks.current.set(id, callback);
    }
    return callback;
  }, []);

  return { containerRef, containerHeight, positions, registerItem };
};
