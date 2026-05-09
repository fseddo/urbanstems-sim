import { useEffect, useState } from 'react';

// Subscribes to a CSS media query and re-renders on match changes.
// Underlying primitive for the named viewport hooks (`useIsDesktop`,
// `useIsNarrow`, `useIsTouch`); call those at consumer sites rather
// than passing breakpoint strings around.
export const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
};
