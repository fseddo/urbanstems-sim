import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

const storedDeliveryDateAtom = atomWithStorage<string | null>(
  'urbanstems-delivery-date',
  null
);

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Reads the user's selected delivery date, or tomorrow if nothing's stored.
// Writes persist to localStorage so the date follows the user across pages.
export const deliveryDateAtom = atom(
  (get) => {
    const stored = get(storedDeliveryDateAtom);
    return stored ? new Date(stored) : tomorrow();
  },
  (_, set, date: Date) => {
    set(storedDeliveryDateAtom, date.toISOString());
  }
);
