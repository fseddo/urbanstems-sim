import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { Product, isVaseAddonEligible } from '@/api/products/Product';
import { VariantType } from '@/api/products/ProductVariant';
import { AddonType } from '@/api/products/AddonType';

export interface CartItem {
  slug: string;
  name: string;
  variant_type: VariantType | null;
  price_dollars: number;
  discounted_price_dollars: number | null;
  main_image: string | null;
  // Snapshotted at add-to-cart time so the cart never re-derives from
  // taxonomy / re-fetches tags. See `isVaseAddonEligible`.
  vase_addon_eligible: boolean;
  // `null` for parent bouquets; set on items in `CartLine.addons`.
  addon_type: AddonType | null;
}

export interface CartLine {
  item: CartItem;
  quantity: number;
  addons: CartItem[];
}

const CART_STORAGE_KEY = 'urbanstems-cart';

// One-shot shape check on module load: if the persisted cart predates the
// add-ons shape (no `addons: []` on every line), clear it so derived atoms
// like `cartTotalAtom` and `lineSetPrice` don't NPE on `line.addons`.
// Drop this block once enough time has passed that no live carts could
// still be on the old shape.
if (typeof window !== 'undefined') {
  const raw = window.localStorage.getItem(CART_STORAGE_KEY);
  if (raw) {
    try {
      const lines = JSON.parse(raw) as CartLine[];
      if (!lines.every((line) => Array.isArray(line.addons))) {
        window.localStorage.removeItem(CART_STORAGE_KEY);
      }
    } catch {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    }
  }
}

// `getOnInit: true` makes the atom read from localStorage at creation time,
// not just on React mount. Without it, route loaders that read this atom
// (e.g. /checkout) see the empty initial value on hard refresh and behave
// as if the cart is empty.
export const cartItemsAtom = atomWithStorage<CartLine[]>(
  CART_STORAGE_KEY,
  [],
  undefined,
  { getOnInit: true }
);

export const cartOpenAtom = atom(false);

export const cartCountAtom = atom((get) =>
  get(cartItemsAtom).reduce((sum, line) => sum + line.quantity, 0)
);

// Per-set unit price (parent + addons, before quantity).
export const lineSetPrice = (line: CartLine): number =>
  line.item.price_dollars +
  line.addons.reduce((sum, addon) => sum + addon.price_dollars, 0);

export const cartTotalAtom = atom((get) =>
  get(cartItemsAtom).reduce(
    (sum, line) => sum + lineSetPrice(line) * line.quantity,
    0
  )
);

// Stable per-line identity used for React keys, line-mutation atoms, and
// the merge check in `addToCartAtom`. Slug alone isn't unique once a
// parent can appear in multiple lines with different addon configs.
// Quantity is excluded — qty changes shouldn't remount the row or split
// the merge bucket.
export const lineFingerprint = (line: CartLine): string =>
  fingerprintOf(line.item.slug, line.addons);

const fingerprintOf = (parentSlug: string, addons: CartItem[]): string =>
  `${parentSlug}|${addons.map((a) => a.slug).sort().join(',')}`;

const snapshotProduct = (product: Product): CartItem => {
  const hasVariantChoices = (product.variants?.length ?? 0) > 1;
  return {
    slug: product.slug,
    name: product.name,
    variant_type: hasVariantChoices ? product.variant_type : null,
    price_dollars: product.price_dollars!,
    discounted_price_dollars: product.discounted_price_dollars,
    main_image: product.main_image,
    vase_addon_eligible: isVaseAddonEligible(product),
    addon_type: product.addon_type,
  };
};

// Adds a bouquet, optionally with addons. Same-fingerprint lines merge
// (qty++); different addon configs stay as separate lines.
export const addToCartAtom = atom(
  null,
  (get, set, payload: { product: Product; addons?: CartItem[] }) => {
    const { product, addons = [] } = payload;
    if (product.price_dollars == null) return;
    const parent = snapshotProduct(product);
    const fingerprint = fingerprintOf(parent.slug, addons);
    const lines = get(cartItemsAtom);
    const existingIdx = lines.findIndex(
      (line) => fingerprintOf(line.item.slug, line.addons) === fingerprint
    );
    set(
      cartItemsAtom,
      existingIdx >= 0
        ? lines.map((line, i) =>
            i === existingIdx ? { ...line, quantity: line.quantity + 1 } : line
          )
        : [...lines, { item: parent, quantity: 1, addons }]
    );
    set(cartOpenAtom, true);
  }
);

export const setLineQuantityAtom = atom(
  null,
  (get, set, payload: { lineId: string; quantity: number }) => {
    const lines = get(cartItemsAtom);
    set(
      cartItemsAtom,
      payload.quantity <= 0
        ? lines.filter((line) => lineFingerprint(line) !== payload.lineId)
        : lines.map((line) =>
            lineFingerprint(line) === payload.lineId
              ? { ...line, quantity: payload.quantity }
              : line
          )
    );
  }
);

export const removeLineAtom = atom(null, (get, set, lineId: string) => {
  set(
    cartItemsAtom,
    get(cartItemsAtom).filter((line) => lineFingerprint(line) !== lineId)
  );
});

// Vase: 1-max per set, replaces existing. Gift: unlimited, appends.
export const attachAddonToLineAtom = atom(
  null,
  (get, set, payload: { lineId: string; addon: CartItem }) => {
    const { lineId, addon } = payload;
    set(
      cartItemsAtom,
      get(cartItemsAtom).map((line) => {
        if (lineFingerprint(line) !== lineId) return line;
        const nextAddons =
          addon.addon_type === 'vase'
            ? [...line.addons.filter((a) => a.addon_type !== 'vase'), addon]
            : [...line.addons, addon];
        return { ...line, addons: nextAddons };
      })
    );
  }
);

// Removes the first addon match by slug — gifts can repeat, and the
// per-row trash is one click per addon to drop.
export const removeAddonFromLineAtom = atom(
  null,
  (get, set, payload: { lineId: string; addonSlug: string }) => {
    const { lineId, addonSlug } = payload;
    set(
      cartItemsAtom,
      get(cartItemsAtom).map((line) => {
        if (lineFingerprint(line) !== lineId) return line;
        const idx = line.addons.findIndex((a) => a.slug === addonSlug);
        if (idx < 0) return line;
        return {
          ...line,
          addons: [...line.addons.slice(0, idx), ...line.addons.slice(idx + 1)],
        };
      })
    );
  }
);

// Selector callers convert a vase/gift Product to CartItem before attach.
export const snapshotAddon = (product: Product): CartItem =>
  snapshotProduct(product);
