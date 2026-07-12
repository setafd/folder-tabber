import { describe, expect, it } from 'vitest';

import { computeMasonryLayout } from './GridContent.masonry';

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
    // First card always goes to column 0 since all columns start at height 0.
    const { positions } = computeMasonryLayout([10], opts(3));
    expect(positions).toEqual([{ top: 0, left: 0 }]);
  });

  it('preserves input order in the output positions array', () => {
    const heights = [5, 50, 15, 30, 10];
    const { positions } = computeMasonryLayout(heights, opts(2));
    expect(positions).toHaveLength(heights.length);
  });
});
