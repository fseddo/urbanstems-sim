'use client';

import { useRef, useState, useEffect } from 'react';

interface HorizontalScrollbarProps {
  targetRef: React.RefObject<HTMLDivElement | null>;
  height?: string;
  thumbColor?: string;
}

export default function HorizontalScrollbar({
  targetRef,
  height = 'h-2.5',
  thumbColor = 'bg-primary',
}: HorizontalScrollbarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [thumbWidth, setThumbWidth] = useState(0);
  const [thumbLeft, setThumbLeft] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [visible, setVisible] = useState(false);
  const dragStartX = useRef(0);
  const scrollStart = useRef(0);
  const fadeTimeout = useRef<NodeJS.Timeout | null>(null);

  // Update thumb size & position
  const updateThumb = () => {
    const container = targetRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

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
      setVisible(true);
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
      if (fadeTimeout.current) clearTimeout(fadeTimeout.current);
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

  return (
    <div
      ref={trackRef}
      className={`relative ${height} bg-background-alt w-[30%] self-center rounded-4xl`}
    >
      <div
        className={`absolute top-0 ${thumbColor} bg-brand-primary h-full cursor-pointer rounded-4xl`}
        style={{ width: thumbWidth, left: thumbLeft }}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
}
