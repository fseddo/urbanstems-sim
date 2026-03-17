import { useEffect, RefObject } from 'react';

export const useHideOnScroll = (
  elementRef: RefObject<HTMLElement | null>
) => {
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    let lastScrollY = window.scrollY;
    let hidden = false;
    let ticking = false;

    const update = () => {
      const scrollY = window.scrollY;
      const threshold = element.getBoundingClientRect().height;
      const scrollingDown = scrollY > lastScrollY;

      if (scrollingDown && scrollY > threshold && !hidden) {
        element.style.transform = 'translateY(-100%)';
        document.documentElement.style.setProperty('--navbar-offset', '0px');
        hidden = true;
      } else if (!scrollingDown && hidden) {
        element.style.transform = 'translateY(0)';
        document.documentElement.style.setProperty(
          '--navbar-offset',
          'var(--navbar-height)'
        );
        hidden = false;
      }

      lastScrollY = scrollY;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [elementRef]);
};
