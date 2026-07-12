import { describe, expect, it } from 'vitest';

import { resolveMoveIndex } from './bookmark.lib';

describe('resolveMoveIndex', () => {
  describe('same container (reorder)', () => {
    it('returns null for a no-op drop (over === old position)', () => {
      expect(resolveMoveIndex({ isSameContainer: true, isBelow: false, oldIndex: 3, overIndex: 3 })).toBeNull();
      expect(resolveMoveIndex({ isSameContainer: true, isBelow: true, oldIndex: 3, overIndex: 3 })).toBeNull();
      expect(resolveMoveIndex({ isSameContainer: true, isBelow: null, oldIndex: 3, overIndex: 3 })).toBeNull();
    });

    it('moving up (overIndex < oldIndex), dropped above target', () => {
      expect(resolveMoveIndex({ isSameContainer: true, isBelow: false, oldIndex: 5, overIndex: 2 })).toEqual({
        localIndex: 2,
        apiIndex: 2,
      });
    });

    it('moving up (overIndex < oldIndex), dropped below target', () => {
      expect(resolveMoveIndex({ isSameContainer: true, isBelow: true, oldIndex: 5, overIndex: 2 })).toEqual({
        localIndex: 3,
        apiIndex: 4,
      });
    });

    it('moving down (overIndex > oldIndex), dropped above target', () => {
      expect(resolveMoveIndex({ isSameContainer: true, isBelow: false, oldIndex: 2, overIndex: 5 })).toEqual({
        localIndex: 4,
        apiIndex: 4,
      });
    });

    it('moving down (overIndex > oldIndex), dropped below target', () => {
      expect(resolveMoveIndex({ isSameContainer: true, isBelow: true, oldIndex: 2, overIndex: 5 })).toEqual({
        localIndex: 5,
        apiIndex: 6,
      });
    });

    it('treats a null isBelow as "above" (falsy)', () => {
      expect(resolveMoveIndex({ isSameContainer: true, isBelow: null, oldIndex: 5, overIndex: 2 })).toEqual({
        localIndex: 2,
        apiIndex: 2,
      });
    });
  });

  describe('cross container (move to a different parent)', () => {
    it('lands at the hovered index, no +1 adjustment even when isBelow', () => {
      expect(resolveMoveIndex({ isSameContainer: false, isBelow: false, oldIndex: 2, overIndex: 0 })).toEqual({
        localIndex: 0,
        apiIndex: 0,
      });
      expect(resolveMoveIndex({ isSameContainer: false, isBelow: true, oldIndex: 2, overIndex: 0 })).toEqual({
        localIndex: 0,
        apiIndex: 0,
      });
    });

    it('appending at the end of the target (overIndex === target length)', () => {
      expect(resolveMoveIndex({ isSameContainer: false, isBelow: false, oldIndex: 0, overIndex: 3 })).toEqual({
        localIndex: 3,
        apiIndex: 3,
      });
    });

    it('never returns null, even when overIndex === oldIndex numerically', () => {
      expect(resolveMoveIndex({ isSameContainer: false, isBelow: false, oldIndex: 2, overIndex: 2 })).toEqual({
        localIndex: 2,
        apiIndex: 2,
      });
    });
  });
});
