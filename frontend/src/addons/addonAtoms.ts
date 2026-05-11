import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { AddonType } from '@/api/products/AddonType';
import { CartItem } from '@/src/cart/cartAtoms';

// Where the user opened the selector. Drives where ADD writes:
//   'pdp'       → pendingAddonsAtom (bundles into next ADD TO BAG)
//   'cart-line' → setLineVaseAtom (vases only — gifts have no cart-line trigger)
export type AddonSelectorContext =
  | { kind: 'pdp'; parentSlug: string }
  | { kind: 'cart-line'; lineId: string };

export type AddonSelectorState = {
  type: AddonType;
  context: AddonSelectorContext;
};

// Single selector atom — `null` = closed. Type + context travel together.
export const addonSelectorAtom = atom<AddonSelectorState | null>(null);

// Per-product PDP staging area. Vase: 1-max. Gifts: grouped by slug with
// a count, so repeated adds increment instead of producing duplicate
// entries.
export type PendingGift = { item: CartItem; count: number };
export type PendingAddons = { vase?: CartItem; gifts: PendingGift[] };

const PENDING_STORAGE_KEY = 'urbanstems-pending-addons';

// One-shot shape check on module load. `gifts` used to be `CartItem[]`;
// it's now `Array<{ item, count }>`. If any persisted gift entry lacks
// `item`, clear the storage so readers don't NPE.
if (typeof window !== 'undefined') {
  const raw = window.localStorage.getItem(PENDING_STORAGE_KEY);
  if (raw) {
    try {
      const data = JSON.parse(raw) as Record<string, PendingAddons>;
      const stale = Object.values(data).some((p) =>
        p?.gifts?.some((g) => g != null && !('item' in g))
      );
      if (stale) window.localStorage.removeItem(PENDING_STORAGE_KEY);
    } catch {
      window.localStorage.removeItem(PENDING_STORAGE_KEY);
    }
  }
}

export const pendingAddonsAtom = atomWithStorage<Record<string, PendingAddons>>(
  PENDING_STORAGE_KEY,
  {},
  undefined,
  { getOnInit: true }
);

const updateProductPending = (
  prev: Record<string, PendingAddons>,
  parentSlug: string,
  mutate: (current: PendingAddons) => PendingAddons
): Record<string, PendingAddons> => ({
  ...prev,
  [parentSlug]: mutate(prev[parentSlug] ?? { gifts: [] }),
});

export const setPendingVaseAtom = atom(
  null,
  (_get, set, payload: { parentSlug: string; vase: CartItem }) => {
    set(pendingAddonsAtom, (prev) =>
      updateProductPending(prev, payload.parentSlug, (current) => ({
        ...current,
        vase: payload.vase,
      }))
    );
  }
);

export const clearPendingVaseAtom = atom(
  null,
  (_get, set, parentSlug: string) => {
    set(pendingAddonsAtom, (prev) =>
      updateProductPending(prev, parentSlug, (current) => ({
        gifts: current.gifts,
      }))
    );
  }
);

// +1 to a gift's count; appends a new entry if none exists for that slug.
export const incrementPendingGiftAtom = atom(
  null,
  (_get, set, payload: { parentSlug: string; gift: CartItem }) => {
    set(pendingAddonsAtom, (prev) =>
      updateProductPending(prev, payload.parentSlug, (current) => {
        const idx = current.gifts.findIndex(
          (g) => g.item.slug === payload.gift.slug
        );
        const nextGifts =
          idx < 0
            ? [...current.gifts, { item: payload.gift, count: 1 }]
            : current.gifts.map((g, i) =>
                i === idx ? { ...g, count: g.count + 1 } : g
              );
        return { ...current, gifts: nextGifts };
      })
    );
  }
);

// −1 from a gift's count; removes the entry when count would hit 0.
export const decrementPendingGiftAtom = atom(
  null,
  (_get, set, payload: { parentSlug: string; giftSlug: string }) => {
    set(pendingAddonsAtom, (prev) => {
      const current = prev[payload.parentSlug];
      if (!current) return prev;
      const idx = current.gifts.findIndex(
        (g) => g.item.slug === payload.giftSlug
      );
      if (idx < 0) return prev;
      const nextCount = current.gifts[idx].count - 1;
      const nextGifts =
        nextCount <= 0
          ? current.gifts.filter((_, i) => i !== idx)
          : current.gifts.map((g, i) =>
              i === idx ? { ...g, count: nextCount } : g
            );
      return {
        ...prev,
        [payload.parentSlug]: { ...current, gifts: nextGifts },
      };
    });
  }
);

// Drop the entire pending entry — `useAddToBagButton` calls this after a
// successful add so addons don't re-apply on a later add.
export const clearPendingForProductAtom = atom(
  null,
  (_get, set, parentSlug: string) => {
    set(pendingAddonsAtom, (prev) => {
      if (!(parentSlug in prev)) return prev;
      const next = { ...prev };
      delete next[parentSlug];
      return next;
    });
  }
);
