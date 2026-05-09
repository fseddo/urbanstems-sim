import { useMediaQuery } from './useMediaQuery';

// Below 375px viewport, two product cards no longer fit (each has a
// `min-w-[160px]` floor + page padding + gap). The collection page
// uses this to force columnCount to 1.
export const useIsNarrow = () => useMediaQuery('(max-width: 374px)');
