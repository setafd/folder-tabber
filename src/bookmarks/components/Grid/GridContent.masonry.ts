import { useLayoutEffect, useMemo, useState } from 'react';

import { GRID_CARD_WIDTH, GRID_GAP } from '@/bookmarks/layout/config';

export interface MasonryLayoutOptions {
  columnCount: number;
  cardWidth: number;
  gap: number;
}
export interface MasonryLayoutResult {
  positions: { top: number; left: number }[];
  containerHeight: number;
}

export const computeMasonryLayout = (
  heights: number[],
  { columnCount, cardWidth, gap }: MasonryLayoutOptions,
): MasonryLayoutResult => {
  const columns = new Array<number>(Math.max(1, columnCount)).fill(0);
  const positions = heights.map((height) => {
    const col = columns.indexOf(Math.min(...columns));
    const top = columns[col];
    columns[col] += height + gap;
    return { top, left: col * (cardWidth + gap) };
  });
  return { positions, containerHeight: Math.max(0, Math.max(...columns) - gap) };
};

export interface MasonryCard {
  id: string;
  narrowHeight: number;
  wideHeight: number;
  baseNarrowHeight?: number;
  baseWideHeight?: number;
}
export interface MasonryItemPosition {
  top: number;
  left: number;
  width: number;
  span: number;
}

export function computeAdaptiveMasonry(items: MasonryCard[], width: number, gap = GRID_GAP) {
  const columnCount = Math.max(1, Math.floor((width + gap) / (GRID_CARD_WIDTH + gap)));
  const cardWidth = Math.max(0, (width - gap * (columnCount - 1)) / columnCount);
  const columns = new Array<number>(columnCount).fill(0);
  const actualColumns = new Array<number>(columnCount).fill(0);
  const positions = new Map<string, MasonryItemPosition>();
  let maximum = 0;
  let sum = 0;
  for (const item of items) {
    const narrowHeight = item.baseNarrowHeight ?? item.narrowHeight;
    const wideHeight = item.baseWideHeight ?? item.wideHeight;
    let best: { col: number; span: number; top: number; bottom: number; sum: number; score: number } | undefined;
    for (let span = 1; span <= Math.min(2, columnCount); span++) {
      if (span === 2 && (narrowHeight < 400 || wideHeight > narrowHeight * 0.75)) continue;
      for (let col = 0; col <= columnCount - span; col++) {
        const top = span === 1 ? columns[col] : Math.max(columns[col], columns[col + 1]);
        const previous = columns[col] + (span === 2 ? columns[col + 1] : 0);
        const bottom = top + (span === 1 ? narrowHeight : wideHeight) + gap;
        const nextSum = sum - previous + span * bottom;
        const holes = span * top - previous;
        const score = Math.max(maximum, bottom) + nextSum * 0.05 + holes * 0.35 + top * 0.01;
        if (!best || score < best.score) best = { col, span, top, bottom, sum: nextSum, score };
      }
    }
    const chosen = best!;
    for (let col = chosen.col; col < chosen.col + chosen.span; col++) columns[col] = chosen.bottom;
    maximum = Math.max(maximum, chosen.bottom);
    sum = chosen.sum;
    const top =
      chosen.span === 1
        ? actualColumns[chosen.col]
        : Math.max(actualColumns[chosen.col], actualColumns[chosen.col + 1]);
    const bottom = top + (chosen.span === 1 ? item.narrowHeight : item.wideHeight) + gap;
    for (let col = chosen.col; col < chosen.col + chosen.span; col++) actualColumns[col] = bottom;
    positions.set(item.id, {
      top,
      left: chosen.col * (cardWidth + gap),
      width: cardWidth * chosen.span + gap * (chosen.span - 1),
      span: chosen.span,
    });
  }
  return { positions, containerHeight: Math.max(0, Math.max(...actualColumns) - gap), columnCount };
}

export const useMasonryLayout = (items: MasonryCard[], frozen = false) => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  const [settled, setSettled] = useState(() => computeAdaptiveMasonry([], 0));
  useLayoutEffect(() => {
    if (!container) return;
    const update = () => {
      if (!frozen) setWidth(container.getBoundingClientRect().width);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, [container, frozen]);
  const next = useMemo(() => computeAdaptiveMasonry(items, width), [items, width]);
  useLayoutEffect(() => {
    if (!frozen) setSettled(next);
  }, [next, frozen]);
  const layout = frozen ? settled : next;
  return { containerRef: setContainer, ...layout, ready: width > 0 };
};
