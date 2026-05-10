import { useRef, useState, useEffect } from 'react';
import { tw } from '../utils/tw';

// Matches the `duration-200` class on the track and the codebase's
// `--animate-fade-in/out` tokens. Keep these aligned: setTimeout drives
// the unmount, the class drives the visual fade — both must match.
const FADE_DURATION_MS = 200;

export interface HorizontalScrollbarProps {
  targetRef: React.RefObject<HTMLDivElement | null>;
  height?: string;
  width?: string;
  thumbColor?: string;
}

export const HorizontalScrollbar = ({
  targetRef,
  height = 'h-1.5',
  width = 'w-[70%]',
  thumbColor = 'bg-brand-primary',
}: HorizontalScrollbarProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [thumbWidth, setThumbWidth] = useState(0);
  const [thumbLeft, setThumbLeft] = useState(0);
  const [dragging, setDragging] = useState(false);
  // Delayed-unmount fade. The mounted→visible split via RAF lets the
  // opacity-0 initial paint commit before flipping to opacity-100 so the
  // CSS transition has a from→to to interpolate.
  const [hasOverflow, setHasOverflow] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const dragStartX = useRef(0);
  const scrollStart = useRef(0);

  // Update thumb size & position. Also flips `hasOverflow` so the bar
  // unmounts when content fits without scrolling — see early-return below.
  const updateThumb = () => {
    const container = targetRef.current;
    if (!container) return;

    // +1 fudge factor for sub-pixel rounding on fractional widths.
    const overflows = container.scrollWidth > container.clientWidth + 1;
    setHasOverflow(overflows);
    if (!overflows) return;

    const track = trackRef.current;
    if (!track) return;

    const ratio = container.clientWidth / container.scrollWidth;
    setThumbWidth(Math.max(ratio * track.clientWidth, 20)); // min 20px
    setThumbLeft(
      (container.scrollLeft / container.scrollWidth) * track.clientWidth
    );
  };

  useEffect(() => {
    const container = targetRef.current;
    if (!container) return;

    const onScroll = () => {
      updateThumb();
    };

    // Initial update
    updateThumb();

    // Watch for content changes (images loading, etc.)
    const resizeObserver = new ResizeObserver(() => {
      updateThumb();
    });

    // Observe the container for size changes
    resizeObserver.observe(container);

    // Also observe all children for size changes
    const observeChildren = () => {
      Array.from(container.children).forEach((child) => {
        resizeObserver.observe(child as Element);
      });
    };

    observeChildren();

    // MutationObserver to detect when new children are added
    const mutationObserver = new MutationObserver(() => {
      observeChildren();
      updateThumb();
    });

    mutationObserver.observe(container, {
      childList: true,
      subtree: true,
    });

    container.addEventListener('scroll', onScroll);
    window.addEventListener('resize', updateThumb);

    return () => {
      container.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', updateThumb);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [targetRef]);

  // Drag logic
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      const container = targetRef.current;
      const track = trackRef.current;
      if (!container || !track) return;

      e.preventDefault();
      document.body.style.userSelect = 'none';

      const delta = e.clientX - dragStartX.current;
      const trackScrollable = track.clientWidth - thumbWidth;
      const scrollable = container.scrollWidth - container.clientWidth;

      container.scrollLeft =
        scrollStart.current + (delta / trackScrollable) * scrollable;
    };

    const onMouseUp = () => {
      setDragging(false);
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragging, thumbWidth, targetRef]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    dragStartX.current = e.clientX;
    scrollStart.current = targetRef.current?.scrollLeft || 0;
  };

  useEffect(() => {
    if (hasOverflow) {
      setMounted(true);
      const id = requestAnimationFrame(() => {
        setVisible(true);
        // Track just mounted; recompute thumb against its real width.
        updateThumb();
      });
      return () => cancelAnimationFrame(id);
    }
    setVisible(false);
    const id = setTimeout(() => setMounted(false), FADE_DURATION_MS);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasOverflow]);

  if (!mounted) return null;

  return (
    <div
      ref={trackRef}
      className={tw(
        'bg-background-alt relative self-center rounded-4xl transition-opacity duration-200',
        width,
        height,
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      )}
    >
      <div
        className={tw(
          'absolute top-0 h-full cursor-pointer rounded-4xl',
          thumbColor
        )}
        style={{ width: thumbWidth, left: thumbLeft }}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
};
