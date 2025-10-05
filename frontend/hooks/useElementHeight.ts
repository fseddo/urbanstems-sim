'use client';

import { useEffect, useState, RefObject } from 'react';

export const useElementHeight = (elementRef: RefObject<HTMLElement | null>) => {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const updateHeight = () => {
      setHeight(element.getBoundingClientRect().height);
    };

    // Initial measurement
    updateHeight();

    // Create ResizeObserver
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(element);

    // Listen for window resize
    window.addEventListener('resize', updateHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, [elementRef]);

  return height;
};