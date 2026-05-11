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
  // `null` for parent bouquets; set on items rendered as their own gift
  // cart line, or attached as a vase on a set line.
  addon_type: AddonType | null;
}

export interface CartLine {
  item: CartItem;
  quantity: number;
  // Only set on bouquet lines that have a vase attached. Gift lines are
  // independent and never carry a vase.
  vase?: CartItem;
}

const CART_STORAGE_KEY = 'urbanstems-cart';

// One-shot shape check on module load. The `vase` field replaced the older
// `addons: []` field; if a stale cart from the old shape still has
// `addons`, clear it so derived atoms don't read fields that no longer
// exist. Drop this guard after enough time has passed.
if (typeof window !== 'undefined') {
  const raw = window.localStorage.getItem(CART_STORAGE_KEY);
  if (raw) {
    try {
      const lines = JSON.parse(raw) as CartLine[];
      const stale = lines.some(
        (line) => 'addons' in (line as object)
      );
      if (stale) window.localStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    }
  }
}

// `getOnInit: true` so route loaders (e.g. /checkout) see the persisted
// value at init time, not after React mount.
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

// Per-set unit price (parent + vase, before quantity).
export const lineSetPrice = (line: CartLine): number =>
  line.item.price_dollars + (line.vase?.price_dollars ?? 0);

export const cartTotalAtom = atom((get) =>
  get(cartItemsAtom).reduce(
    (sum, line) => sum + lineSetPrice(line) * line.quantity,
    0
  )
);

// Stable per-line identity. Slug alone isn't unique once a parent can
// appear in multiple lines with different vase configs. Quantity is
// excluded — qty changes shouldn't remount the row or split the merge.
export const lineFingerprint = (line: CartLine): string =>
  `${line.item.slug}|${line.vase?.slug ?? ''}`;

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

// Selector / pending-addon callers use this name for clarity at the call
// site; functionally identical to `snapshotProduct`.
export const snapshotAddon = (product: Product): CartItem =>
  snapshotProduct(product);

// Bumps qty if a same-fingerprint line exists; otherwise pushes new.
const upsertLine = (lines: CartLine[], newLine: CartLine): CartLine[] => {
  const fp = lineFingerprint(newLine);
  const idx = lines.findIndex((l) => lineFingerprint(l) === fp);
  if (idx < 0) return [...lines, newLine];
  return lines.map((l, i) =>
    i === idx ? { ...l, quantity: l.quantity + newLine.quantity } : l
  );
};

// Adds the bouquet (with optional vase) as one set line; splits each
// pending gift into its own line with `count` as the quantity.
export const addToCartAtom = atom(
  null,
  (
    get,
    set,
    payload: {
      product: Product;
      vase?: CartItem;
      gifts?: Array<{ item: CartItem; count: number }>;
    }
  ) => {
    const { product, vase, gifts = [] } = payload;
    if (product.price_dollars == null) return;
    const parent = snapshotProduct(product);
    let lines = get(cartItemsAtom);
    lines = upsertLine(lines, { item: parent, quantity: 1, vase });
    for (const g of gifts) {
      lines = upsertLine(lines, { item: g.item, quantity: g.count });
    }
    set(cartItemsAtom, lines);
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

// Sets/replaces the vase on a bouquet line; `vase: null` removes it.
export const setLineVaseAtom = atom(
  null,
  (get, set, payload: { lineId: string; vase: CartItem | null }) => {
    set(
      cartItemsAtom,
      get(cartItemsAtom).map((line) => {
        if (lineFingerprint(line) !== payload.lineId) return line;
        if (payload.vase !== null) return { ...line, vase: payload.vase };
        const next = { ...line };
        delete next.vase;
        return next;
      })
    );
  }
);
