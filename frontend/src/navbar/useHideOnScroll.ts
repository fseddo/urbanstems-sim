import { useEffect, useRef, RefObject } from 'react';
import { useLocation, useRouterState } from '@tanstack/react-router';

export const useHideOnScroll = (elementRef: RefObject<HTMLElement | null>) => {
  const { pathname } = useLocation();
  const isLoading = useRouterState({ select: (s) => s.isLoading });
  const isLoadingRef = useRef(isLoading);
  isLoadingRef.current = isLoading;

  // Instantly reset navbar on route change — but only after loading completes
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (isLoading) return;

    const element = elementRef.current;
    if (!element) return;

    // Only reset if pathname actually changed
    if (prevPathnameRef.current === pathname) return;
    prevPathnameRef.current = pathname;

    element.style.transition = 'none';
    element.style.transform = 'translateY(0)';
    document.documentElement.style.setProperty(
      '--navbar-offset',
      'var(--navbar-height)'
    );
    document.documentElement.style.setProperty(
      '--navbar-offset-transition',
      'none'
    );

    // Force reflow, then re-enable transitions
    element.offsetHeight;
    element.style.transition = '';
    document.documentElement.style.setProperty(
      '--navbar-offset-transition',
      'top 300ms'
    );
  }, [pathname, isLoading, elementRef]);

  // Scroll-based hide/show — paused during pending navigation
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    let lastScrollY = window.scrollY;
    let hidden = false;
    let ticking = false;

    const update = () => {
      if (isLoadingRef.current) {
        lastScrollY = window.scrollY;
        ticking = false;
        return;
      }

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
