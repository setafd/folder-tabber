import { describe, expect, it } from 'vitest';

import { fromContainerId, toContainerId } from './index';

describe('container id helpers', () => {
  it('prefixes an id when converting to a container id', () => {
    expect(toContainerId('60')).toBe('container:60');
  });

  it('extracts the real id back out of a container id', () => {
    expect(fromContainerId('container:60')).toBe('60');
  });

  it('returns null for an id that is not a container id', () => {
    expect(fromContainerId('60')).toBeNull();
  });

  it('round-trips any raw id', () => {
    for (const id of ['60', 'g1', 'some-uuid-1234', '']) {
      expect(fromContainerId(toContainerId(id))).toBe(id);
    }
  });

  it('does not confuse an item id that happens to contain the prefix substring elsewhere', () => {
    expect(fromContainerId('not-container:60')).toBeNull();
  });
});
