import { type PropsWithChildren } from 'react';

import { type MasonryItemPosition } from '../GridContent.masonry';

export const MasonryItem = ({
  id,
  position,
  children,
}: PropsWithChildren<{ id: string; position?: MasonryItemPosition }>) => (
  <div
    data-card-id={id}
    data-span={position?.span ?? 1}
    style={{
      position: 'absolute',
      width: position?.width ?? 0,
      top: position?.top ?? 0,
      left: position?.left ?? 0,
      visibility: position ? 'visible' : 'hidden',
    }}
  >
    {children}
  </div>
);
