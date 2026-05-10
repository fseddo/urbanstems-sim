import { useEffect, useRef, RefObject } from 'react';
import { useLocation, useRouterState } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';
import { navbarPanelAtom } from './navbarAtoms';

export const useHideOnScroll = (elementRef: RefObject<HTMLElement | null>) => {
  const { pathname } = useLocation();
  const isLoading = useRouterState({ select: (s) => s.isLoading });
  const navbarPanel = useAtomValue(navbarPanelAtom);
  const isLoadingRef = useRef(isLoading);
  isLoadingRef.current = isLoading;
  const panelOpenRef = useRef(navbarPanel !== null);
  panelOpenRef.current = navbarPanel !== null;
  // Tracked across effects so the panel-open effect can reset it when it
  // forces the navbar visible, keeping the scroll handler's state coherent.
  const hiddenRef = useRef(false);

  // When any navbar panel opens, force the navbar back to visible. Otherwise
  // a panel mounted while the navbar was hidden (translated up via scroll)
  // would hang off-screen — its `absolute top-full` positioning inherits
  // the navbar's transform.
  useEffect(() => {
    if (!navbarPanel) return;
    const element = elementRef.current;
    if (!element) return;
    element.style.transform = 'translateY(0)';
    document.documentElement.style.setProperty(
      '--navbar-offset',
      'var(--navbar-height)'
    );
    document.documentElement.style.setProperty(
      '--navbar-offset-transition',
      'top 300ms'
    );
    hiddenRef.current = false;
  }, [navbarPanel, elementRef]);

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

  // Scroll-based hide/show — paused during pending navigation and during
  // window resize. Resize triggers reflow which can clamp `window.scrollY`
  // (e.g. you're at the bottom of a long page that becomes shorter), and
  // those involuntary scroll events would otherwise read as direction
  // changes and make the navbar flutter in/out.
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    let lastScrollY = window.scrollY;
    let ticking = false;
    let resizing = false;
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;

    const update = () => {
      if (isLoadingRef.current || resizing || panelOpenRef.current) {
        lastScrollY = window.scrollY;
        ticking = false;
        return;
      }

      const scrollY = window.scrollY;
      const threshold = element.getBoundingClientRect().height;
      const scrollingDown = scrollY > lastScrollY;

      if (scrollingDown && scrollY > threshold && !hiddenRef.current) {
        element.style.transform = 'translateY(-100%)';
        document.documentElement.style.setProperty('--navbar-offset', '0px');
        document.documentElement.style.setProperty(
          '--navbar-offset-transition',
          'top 300ms'
        );
        hiddenRef.current = true;
      } else if (!scrollingDown && hiddenRef.current) {
        element.style.transform = 'translateY(0)';
        document.documentElement.style.setProperty(
          '--navbar-offset',
          'var(--navbar-height)'
        );
        document.documentElement.style.setProperty(
          '--navbar-offset-transition',
          'top 300ms'
        );
        hiddenRef.current = false;
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

    const onResize = () => {
      resizing = true;
      clearTimeout(resizeTimer);
      // After ~200ms of no resize, treat the layout as settled. Re-sync
      // `lastScrollY` so the next real scroll event compares against the
      // post-reflow position, not the pre-resize one.
      resizeTimer = setTimeout(() => {
        resizing = false;
        lastScrollY = window.scrollY;
      }, 200);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      clearTimeout(resizeTimer);
    };
  }, [elementRef]);
};
