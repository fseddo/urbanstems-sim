import { atom, useAtom } from 'jotai';
import { useCallback } from 'react';

// Navbar UI state. Single-active-panel encoding because the navbar's actual
// invariant is "at most one expanded panel at a time" — the desktop shop
// hover, the search overlay, and the mobile menu are mutually exclusive.
// Modeling that as the data shape gets the close-others behavior for free
// (setting the atom to 'search' implicitly closes shop), instead of every
// site that opens a panel having to clear the others by hand.

export type NavbarPanel = 'shop' | 'search' | 'mobileMenu';

export const navbarPanelAtom = atom<NavbarPanel | null>(null);

// Derived: true while a panel that hangs off the navbar (desktop shop or
// search dropdown) is open. Used by the root layout to dim the page beneath.
// Mobile menu uses SlidePane with its own portaled backdrop, so it's
// intentionally excluded here.
export const navbarDropdownOpenAtom = atom((get) => {
  const panel = get(navbarPanelAtom);
  return panel === 'shop' || panel === 'search';
});

// Single source of truth for the navbar's search term. Drives the visible
// `<input>` value and the dropdowns' query keys. Query consumers debounce
// locally via `useDebounce` so typing doesn't spam the backend.
export const searchTermAtom = atom('');

// Boolean-style hook for a single panel — preserves the [isOpen, setIsOpen]
// shape of `useState`. setIsOpen(true) opens this panel (closing any other);
// setIsOpen(false) is a no-op unless this panel is currently active, in
// which case it clears.
export const useNavbarPanel = (panel: NavbarPanel) => {
  const [active, setActive] = useAtom(navbarPanelAtom);
  const isOpen = active === panel;
  const setIsOpen = useCallback(
    (next: boolean) => {
      setActive((curr) => (next ? panel : curr === panel ? null : curr));
    },
    [setActive, panel]
  );
  return [isOpen, setIsOpen] as const;
};
