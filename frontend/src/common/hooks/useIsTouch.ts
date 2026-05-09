import { useMediaQuery } from './useMediaQuery';

// Matches devices whose primary pointer is imprecise — phones, most
// tablets, and DevTools device emulation. Desktop with a mouse stays
// `fine` regardless of window size, which is what we want: a small
// desktop window still gets pointer-precision UI (anchored dropdowns,
// hover states), not touch-friendly modal UI.
export const useIsTouch = () => useMediaQuery('(pointer: coarse)');
