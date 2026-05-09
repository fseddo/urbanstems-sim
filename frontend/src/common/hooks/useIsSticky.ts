import { useEffect, useRef, useState } from 'react';

// Detects whether a `position: sticky` element is currently in its "stuck"
// state via a 1px sentinel placed just above it: while the sentinel is in the
// viewport, the sticky element is in document flow; once the sentinel scrolls
// out, the sticky element has reached its `top` threshold and is pinned.
//
// Caller renders `<div ref={sentinelRef} />` immediately above the sticky
// element, then keys styling/behavior off `isStuck`. Pass `enabled = false`
// to suspend observation (e.g. when the sticky behavior is gated on viewport)
// — `isStuck` resets to `false` while disabled and the observer disconnects.
//
// NOT for `position: fixed` elements, which are always at the same screen
// position and have no analogous "engaged" transition. The navbar's
// hide-on-scroll lives in [`useHideOnScroll`](../navbar/useHideOnScroll.ts).

export const useIsSticky = (enabled: boolean = true) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isStuck, setIsStuck] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIsStuck(false);
      return;
    }
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsStuck(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [enabled]);

  return { sentinelRef, isStuck };
};
