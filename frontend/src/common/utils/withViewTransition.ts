import { flushSync } from 'react-dom';

// Wrap a React state update in the CSS View Transitions API so the browser
// snapshots the DOM before/after and animates between them. `flushSync`
// forces React to apply the update synchronously inside the callback so the
// "after" snapshot reflects the new state.
//
// Elements with a matching `view-transition-name` morph between their old
// and new positions/sizes (used for the menu-search-bar → navbar-search-input
// morph). Other content cross-fades by default.
//
// Browsers without the API (Firefox without the flag, older Chrome/Safari)
// fall through to running the update directly — no animation, no flicker.

export const withViewTransition = (update: () => void) => {
  if (
    typeof document === 'undefined' ||
    !('startViewTransition' in document)
  ) {
    update();
    return;
  }
  document.startViewTransition(() => flushSync(update));
};
