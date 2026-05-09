import { useMediaQuery } from './useMediaQuery';

// Matches the `lg:` Tailwind breakpoint used throughout the listing
// header — viewport at desktop width.
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
