import { describe, expect, it } from 'vitest';

import { computeAdaptiveMasonry, computeMasonryLayout } from './GridContent.masonry';

const opts = (columnCount: number) => ({ columnCount, cardWidth: 250, gap: 8 });

describe('computeMasonryLayout', () => {
  it('returns empty positions and a zero container height for no cards', () => {
    expect(computeMasonryLayout([], opts(3))).toEqual({ positions: [], containerHeight: 0 });
  });

  it('stacks every card in a single column, in order', () => {
    expect(computeMasonryLayout([10, 20, 30], opts(1))).toEqual({
      positions: [
        { top: 0, left: 0 },
        { top: 18, left: 0 },
        { top: 46, left: 0 },
      ],
      containerHeight: 76,
    });
  });

  it('gives every card its own column when there are more columns than cards', () => {
    expect(computeMasonryLayout([10, 20], { columnCount: 4, cardWidth: 100, gap: 8 })).toEqual({
      positions: [
        { top: 0, left: 0 },
        { top: 0, left: 108 },
      ],
      containerHeight: 20,
    });
  });

  it('round-robins equal-height cards across columns left to right', () => {
    expect(computeMasonryLayout([10, 10, 10, 10], opts(2))).toEqual({
      positions: [
        { top: 0, left: 0 },
        { top: 0, left: 258 },
        { top: 18, left: 0 },
        { top: 18, left: 258 },
      ],
      containerHeight: 28,
    });
  });

  it('routes later cards around a column a tall card dominates', () => {
    expect(computeMasonryLayout([100, 10, 10, 10], opts(2))).toEqual({
      positions: [
        { top: 0, left: 0 },
        { top: 0, left: 258 },
        { top: 18, left: 258 },
        { top: 36, left: 258 },
      ],
      containerHeight: 100,
    });
  });

  it('breaks ties on the leftmost column', () => {
    const { positions } = computeMasonryLayout([10], opts(3));
    expect(positions).toEqual([{ top: 0, left: 0 }]);
  });

  it('preserves input order in the output positions array', () => {
    const heights = [5, 50, 15, 30, 10];
    const { positions } = computeMasonryLayout(heights, opts(2));
    expect(positions).toHaveLength(heights.length);
  });
});

describe('adaptive spanning', () => {
  it('uses two columns to shorten a large folder', () => {
    const layout = computeAdaptiveMasonry(
      [
        { id: 'large', narrowHeight: 926, wideHeight: 494 },
        { id: 'small', narrowHeight: 170, wideHeight: 170 },
      ],
      1128,
    );
    expect(layout.positions.get('large')?.span).toBe(2);
  });
  it('fits a narrow window without overflow', () => {
    const layout = computeAdaptiveMasonry([{ id: 'large', narrowHeight: 926, wideHeight: 494 }], 210);
    expect(layout.positions.get('large')).toEqual({ span: 1, width: 210, top: 0, left: 0 });
  });
  it('keeps a large indivisible nested branch narrow when widening gives no benefit', () => {
    expect(
      computeAdaptiveMasonry([{ id: 'branch', narrowHeight: 926, wideHeight: 926 }], 1128).positions.get('branch')
        ?.span,
    ).toBe(1);
  });
  it('never overlaps cards with mixed widths and heights', () => {
    const items = Array.from({ length: 80 }, (_, index) => ({
      id: String(index),
      narrowHeight: index % 3 ? 134 + (index % 5) * 36 : 926,
      wideHeight: index % 3 ? 134 : 494,
    }));
    const { positions, containerHeight } = computeAdaptiveMasonry(items, 1128);
    for (let i = 0; i < items.length; i++) {
      const a = positions.get(items[i].id)!;
      const ah = a.span === 2 ? items[i].wideHeight : items[i].narrowHeight;
      expect(a.top + ah).toBeLessThanOrEqual(containerHeight);
      expect(a.left + a.width).toBeLessThanOrEqual(1128);
      for (let j = i + 1; j < items.length; j++) {
        const b = positions.get(items[j].id)!;
        const bh = b.span === 2 ? items[j].wideHeight : items[j].narrowHeight;
        expect(
          a.left >= b.left + b.width || b.left >= a.left + a.width || a.top >= b.top + bh || b.top >= a.top + ah,
        ).toBe(true);
      }
    }
  });
});

describe('expansion keeps spatial context', () => {
  it('preserves columns and spans while growing only vertical offsets', () => {
    const cards = Array.from({ length: 12 }, (_, index) => ({
      id: String(index),
      narrowHeight: index === 1 ? 926 : 206,
      wideHeight: index === 1 ? 494 : 134,
      baseNarrowHeight: index === 1 ? 926 : 206,
      baseWideHeight: index === 1 ? 494 : 134,
    }));
    const before = computeAdaptiveMasonry(cards, 1128);
    const expanded = cards.map((card, index) =>
      index === 1 ? { ...card, narrowHeight: 2366, wideHeight: 1934 } : card,
    );
    const after = computeAdaptiveMasonry(expanded, 1128);
    for (const card of cards) {
      const a = before.positions.get(card.id)!;
      const b = after.positions.get(card.id)!;
      expect({ left: b.left, width: b.width, span: b.span }).toEqual({ left: a.left, width: a.width, span: a.span });
      expect(b.top).toBeGreaterThanOrEqual(a.top);
    }
    expect(after.positions.get('0')).toEqual(before.positions.get('0'));
    const rectangles = expanded.map((card) => {
      const p = after.positions.get(card.id)!;
      return { ...p, height: p.span === 2 ? card.wideHeight : card.narrowHeight };
    });
    for (let i = 0; i < rectangles.length; i++)
      for (const b of rectangles.slice(i + 1)) {
        const a = rectangles[i];
        expect(
          a.left >= b.left + b.width ||
            b.left >= a.left + a.width ||
            a.top >= b.top + b.height ||
            b.top >= a.top + a.height,
        ).toBe(true);
      }
  });
});
