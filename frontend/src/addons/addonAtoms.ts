import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { AddonType } from '@/api/products/AddonType';
import { CartItem } from '@/src/cart/cartAtoms';

// Where the user opened the selector. Drives where ADD writes:
//   'pdp'       → pendingAddonsAtom (bundles into next ADD TO BAG)
//   'cart-line' → attachAddonToLineAtom (immediate)
export type AddonSelectorContext =
  | { kind: 'pdp'; parentSlug: string }
  | { kind: 'cart-line'; lineId: string };

export type AddonSelectorState = {
  type: AddonType;
  context: AddonSelectorContext;
};

// Single selector atom — `null` means closed. Type + context travel
// together in one payload, replacing the earlier per-type atoms.
export const addonSelectorAtom = atom<AddonSelectorState | null>(null);

export type PendingAddons = { vase?: CartItem; gifts: CartItem[] };

// `getOnInit: true` so route loaders see the persisted value at init time
// (mirrors `cartItemsAtom`).
export const pendingAddonsAtom = atomWithStorage<Record<string, PendingAddons>>(
  'urbanstems-pending-addons',
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

export const addPendingGiftAtom = atom(
  null,
  (_get, set, payload: { parentSlug: string; gift: CartItem }) => {
    set(pendingAddonsAtom, (prev) =>
      updateProductPending(prev, payload.parentSlug, (current) => ({
        ...current,
        gifts: [...current.gifts, payload.gift],
      }))
    );
  }
);

export const removePendingGiftAtom = atom(
  null,
  (_get, set, payload: { parentSlug: string; giftSlug: string }) => {
    set(pendingAddonsAtom, (prev) => {
      const current = prev[payload.parentSlug];
      if (!current) return prev;
      const idx = current.gifts.findIndex((g) => g.slug === payload.giftSlug);
      if (idx < 0) return prev;
      return updateProductPending(prev, payload.parentSlug, (cur) => ({
        ...cur,
        gifts: [...cur.gifts.slice(0, idx), ...cur.gifts.slice(idx + 1)],
      }));
    });
  }
);

// Drop the entire pending entry for a product — called by `useAddToBagButton`
// after a successful add so the bundled addons don't re-apply on re-add.
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
