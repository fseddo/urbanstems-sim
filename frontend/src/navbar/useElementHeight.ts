import { useEffect, RefObject } from 'react';

/**
 * Sets a CSS variable `--navbar-height` on the document root,
 * kept in sync via ResizeObserver. Consumers use the variable
 * directly in CSS — no JS re-renders, no flash of 0.
 */
export const useNavbarCssHeight = (
  elementRef: RefObject<HTMLElement | null>
) => {
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const update = () => {
      document.documentElement.style.setProperty(
        '--navbar-height',
        `${element.getBoundingClientRect().height}px`
      );
    };

    update();

    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(element);
    window.addEventListener('resize', update);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [elementRef]);
};
