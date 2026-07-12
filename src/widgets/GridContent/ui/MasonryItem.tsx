import { PropsWithChildren } from 'react';

import type { MasonryItemPosition } from '../GridContent.masonry';

type MasonryItemProps = PropsWithChildren<{
  id: string;
  width: number;
  position?: MasonryItemPosition;
  registerItem: (id: string) => (element: HTMLElement | null) => void;
}>;

/**
 * Absolutely-positioned wrapper applied only around top-level grid cards. Owns positioning
 * exclusively via `top`/`left` (never `transform`) so it never competes with dnd-kit, which
 * owns `transform` on the card it wraps. Stays hidden (but still rendered, so it can still be
 * measured) until the layout hook has computed its first real position, to avoid a flash of
 * every card stacked at (0, 0).
 */
export const MasonryItem = ({ id, width, position, registerItem, children }: MasonryItemProps) => {
  return (
    <div
      ref={registerItem(id)}
      style={{
        position: 'absolute',
        width,
        top: position?.top ?? 0,
        left: position?.left ?? 0,
        visibility: position ? 'visible' : 'hidden',
      }}
    >
      {children}
    </div>
  );
};
