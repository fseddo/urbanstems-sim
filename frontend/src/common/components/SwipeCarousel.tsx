import {
  CSSProperties,
  PointerEvent,
  ReactNode,
  useRef,
  useState,
} from 'react';
import { tw } from '../utils/tw';

type Props<T> = {
  slides: readonly T[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
  renderSlide: (slide: T, index: number) => ReactNode;
  className?: string;
  // Drag distance (as fraction of container width, 0–1) above which a
  // pointerup advances/retreats one slide. Default 0.25 — a quarter of
  // the visible width.
  swipeThreshold?: number;
  // Snap animation duration in ms. Default 300.
  durationMs?: number;
};

// Pointer-drag-driven horizontal carousel. One slide visible at a time,
// snaps to the next/previous on release if the drag exceeded the
// threshold. Generic over the slide value type so callers keep their
// narrowed types (e.g. `'main' | 'hover'`) instead of widening to
// `unknown`.
//
// Built for the PDP hero (2 slides). Designed minimally — no momentum,
// no rubber-banding at edges, no autoplay. If a third use case lands
// wanting any of those, swap internals for `embla-carousel-react` and
// keep the same API.
//
// `touch-action: pan-y` lets vertical page scroll continue to work
// underneath horizontal swipes; pointer capture keeps us receiving
// pointermove events even if the pointer leaves the element.

export const SwipeCarousel = <T,>({
  slides,
  activeIndex,
  onIndexChange,
  renderSlide,
  className,
  swipeThreshold = 0.25,
  durationMs = 300,
}: Props<T>) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragDelta, setDragDelta] = useState(0);

  const isDragging = dragStartX !== null;

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    setDragStartX(e.clientX);
    setDragDelta(0);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragStartX === null) return;
    setDragDelta(e.clientX - dragStartX);
  };

  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    if (dragStartX === null) return;
    const containerWidth = containerRef.current?.clientWidth ?? 1;
    const ratio = dragDelta / containerWidth;
    if (Math.abs(ratio) > swipeThreshold) {
      // Negative delta (drag left) → advance to next slide. Clamp to bounds.
      const direction = ratio < 0 ? 1 : -1;
      const next = Math.max(
        0,
        Math.min(slides.length - 1, activeIndex + direction)
      );
      if (next !== activeIndex) onIndexChange(next);
    }
    setDragStartX(null);
    setDragDelta(0);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const trackStyle: CSSProperties = {
    width: `${slides.length * 100}%`,
    transform: `translateX(calc(${(-activeIndex / slides.length) * 100}% + ${dragDelta}px))`,
    transition: isDragging ? 'none' : `transform ${durationMs}ms ease-out`,
  };

  const slideStyle: CSSProperties = {
    width: `${100 / slides.length}%`,
  };

  return (
    <div
      ref={containerRef}
      className={tw('relative touch-pan-y overflow-hidden', className)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div className='flex' style={trackStyle}>
        {slides.map((slide, i) => (
          <div key={i} className='shrink-0' style={slideStyle}>
            {renderSlide(slide, i)}
          </div>
        ))}
      </div>
    </div>
  );
};
