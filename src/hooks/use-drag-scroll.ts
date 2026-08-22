'use client';

import { useCallback, useMemo, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';

export type DragScrollDirection = 'left' | 'right';

export interface DragScrollHandlers {
  onPointerDown: (event: ReactPointerEvent) => void;
  onPointerMove: (event: ReactPointerEvent) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
}

export interface DragScrollControls {
  handlers: DragScrollHandlers;
  scrollBy: (direction: DragScrollDirection, amount?: number) => void;
}

const DEFAULT_SCROLL_AMOUNT = 344;
const DRAG_MULTIPLIER = 2;

/**
 * Drag-to-scroll for horizontal carousels. Pass the ref you attach to the
 * scrolling element; spread `handlers` onto it and call `scrollBy` from arrow
 * buttons. The element is expected to carry the resting `cursor: 'grab'`
 * style; the handlers flip it to 'grabbing' while a drag is live.
 */
export function useDragScroll<T extends HTMLElement = HTMLDivElement>(
  ref: RefObject<T | null>,
  options?: { scrollAmount?: number }
): DragScrollControls {
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const startScrollLeft = useRef(0);

  const defaultAmount = options?.scrollAmount ?? DEFAULT_SCROLL_AMOUNT;

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent) => {
      const el = ref.current;
      if (!el) return;
      isDragging.current = true;
      dragStartX.current = event.pageX - el.offsetLeft;
      startScrollLeft.current = el.scrollLeft;
      el.style.cursor = 'grabbing';
    },
    [ref]
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent) => {
      const el = ref.current;
      if (!isDragging.current || !el) return;
      event.preventDefault();
      const x = event.pageX - el.offsetLeft;
      el.scrollLeft = startScrollLeft.current - (x - dragStartX.current) * DRAG_MULTIPLIER;
    },
    [ref]
  );

  const endDrag = useCallback(() => {
    isDragging.current = false;
    if (ref.current) ref.current.style.cursor = 'grab';
  }, [ref]);

  const scrollBy = useCallback(
    (direction: DragScrollDirection, amount?: number) => {
      const delta = amount ?? defaultAmount;
      ref.current?.scrollBy({
        left: direction === 'left' ? -delta : delta,
        behavior: 'smooth',
      });
    },
    [ref, defaultAmount]
  );

  return useMemo(
    () => ({
      handlers: {
        onPointerDown: handlePointerDown,
        onPointerMove: handlePointerMove,
        onPointerUp: endDrag,
        onPointerLeave: endDrag,
      },
      scrollBy,
    }),
    [handlePointerDown, handlePointerMove, endDrag, scrollBy]
  );
}
