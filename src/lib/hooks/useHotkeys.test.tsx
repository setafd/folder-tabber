import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useHotkeys } from './useHotkeys';

const keys = ['1'] as const;
function Harness({ onKey }: { onKey: (key: string) => void }) {
  useHotkeys(keys, onKey);
  return null;
}
afterEach(cleanup);

describe('navigation hotkeys', () => {
  it('leaves typing in a custom page shadow root untouched', () => {
    const onKey = vi.fn();
    const { container } = render(<Harness onKey={onKey} />);
    const host = container.appendChild(document.createElement('div'));
    const field = host.attachShadow({ mode: 'open' }).appendChild(document.createElement('textarea'));
    const event = new KeyboardEvent('keydown', { key: '1', bubbles: true, composed: true, cancelable: true });
    field.dispatchEvent(event);
    expect(onKey).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });
  it('continues to navigate when the key is pressed outside a field', () => {
    const onKey = vi.fn();
    const { container } = render(<Harness onKey={onKey} />);
    const event = new KeyboardEvent('keydown', { key: '1', bubbles: true, composed: true, cancelable: true });
    container.dispatchEvent(event);
    expect(onKey).toHaveBeenCalledWith('1');
    expect(event.defaultPrevented).toBe(true);
  });
});
