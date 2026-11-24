import { describe, expect, it } from 'vitest';

import { resolveMoveIndex } from './bookmark.lib';

describe('Bookmark insertion slots', () => {
  it('places every pair before/after correctly in both directions, including adjacent no-ops', () => {
    const original = ['A', 'B', 'C', 'D', 'E'];
    for (let oldIndex = 0; oldIndex < original.length; oldIndex++) {
      for (let overIndex = 0; overIndex < original.length; overIndex++) {
        if (oldIndex === overIndex) continue;
        for (const isBelow of [false, true]) {
          const expected = original.filter((_, index) => index !== oldIndex);
          const destination = expected.indexOf(original[overIndex]) + (isBelow ? 1 : 0);
          expected.splice(destination, 0, original[oldIndex]);
          const resolved = resolveMoveIndex({ isSameContainer: true, oldIndex, overIndex, isBelow });
          const actual = [...original];
          if (resolved) {
            const [moved] = actual.splice(oldIndex, 1);
            const finalIndex =
              resolved.insertionIndex > oldIndex ? resolved.insertionIndex - 1 : resolved.insertionIndex;
            actual.splice(finalIndex, 0, moved);
            expect(resolved.finalIndex).toBe(finalIndex);
          }
          expect(actual).toEqual(expected);
        }
      }
    }
  });
  it('honours both halves across parents', () => {
    expect(
      resolveMoveIndex({ isSameContainer: false, oldIndex: 3, overIndex: 1, isBelow: false })?.insertionIndex,
    ).toBe(1);
    expect(resolveMoveIndex({ isSameContainer: false, oldIndex: 3, overIndex: 1, isBelow: true })?.insertionIndex).toBe(
      2,
    );
  });
  it('keeps explicit append at target length without another increment', () => {
    expect(resolveMoveIndex({ isSameContainer: true, oldIndex: 0, overIndex: 5, isBelow: false })).toEqual({
      insertionIndex: 5,
      finalIndex: 4,
    });
  });
  it('rejects self and missing targets', () => {
    expect(resolveMoveIndex({ isSameContainer: true, oldIndex: 2, overIndex: 2, isBelow: true })).toBeNull();
    expect(resolveMoveIndex({ isSameContainer: true, oldIndex: 2, overIndex: -1, isBelow: false })).toBeNull();
  });
});
