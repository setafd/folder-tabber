import { type PropsWithChildren, useLayoutEffect, useRef } from 'react';

import { type MasonryItemPosition } from '../GridContent.masonry';

export const MasonryItem = ({
  id,
  position,
  expansion,
  frozen,
  children,
}: PropsWithChildren<{ id: string; position?: MasonryItemPosition; expansion: number; frozen: boolean }>) => {
  const element = useRef<HTMLDivElement>(null);
  const previous = useRef({ position, expansion });
  const motion = useRef<Animation | null>(null);

  useLayoutEffect(() => {
    const last = previous.current;
    previous.current = { position, expansion };
    const card = element.current;
    if (
      frozen ||
      !position ||
      !last.position ||
      last.position.left !== position.left ||
      last.position.width !== position.width
    ) {
      motion.current?.cancel();
      return;
    }
    if (
      last.expansion === expansion ||
      last.position.top === position.top ||
      !card?.animate ||
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    )
      return;

    let offset = last.position.top - position.top;
    if (motion.current?.playState === 'running') {
      const transform = getComputedStyle(card).transform;
      if (transform !== 'none') offset += new DOMMatrixReadOnly(transform).m42;
    }
    motion.current?.cancel();
    motion.current = card.animate([{ transform: `translateY(${offset}px)` }, { transform: 'translateY(0)' }], {
      duration: 170,
      easing: 'cubic-bezier(.2, .7, .35, 1)',
    });
  }, [expansion, frozen, position]);

  return (
    <div
      ref={element}
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
};
