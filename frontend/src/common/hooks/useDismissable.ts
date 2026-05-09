import { useEffect, type RefObject } from 'react';

// Wire Esc-key + click-outside-the-ref dismissal to a single callback.
// Listeners only register while `enabled` is true so consumers can gate on
// their own open/closed state without remounting.

export const useDismissable = (
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
  onDismiss: () => void
) => {
  useEffect(() => {
    if (!enabled) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onDismiss();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [ref, enabled, onDismiss]);
};
