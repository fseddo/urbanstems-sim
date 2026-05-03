import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { Product } from '@/api/products/Product';
import { VariantType } from '@/api/products/ProductVariant';

export interface CartItem {
  slug: string;
  name: string;
  variant_type: VariantType | null;
  price_dollars: number;
  discounted_price_dollars: number | null;
  main_image: string | null;
}

export interface CartLine {
  item: CartItem;
  quantity: number;
}

// `getOnInit: true` makes the atom read from localStorage at creation time,
// not just on React mount. Without it, route loaders that read this atom
// (e.g. /checkout) see the empty initial value on hard refresh and behave
// as if the cart is empty.
export const cartItemsAtom = atomWithStorage<CartLine[]>(
  'urbanstems-cart',
  [],
  undefined,
  { getOnInit: true }
);

export const cartOpenAtom = atom(false);

export const cartCountAtom = atom((get) =>
  get(cartItemsAtom).reduce((sum, line) => sum + line.quantity, 0)
);

export const cartTotalAtom = atom((get) =>
  get(cartItemsAtom).reduce(
    (sum, line) => sum + line.item.price_dollars * line.quantity,
    0
  )
);

export const addToCartAtom = atom(null, (get, set, product: Product) => {
  if (product.price_dollars == null) return;
  const lines = get(cartItemsAtom);
  const existing = lines.find((line) => line.item.slug === product.slug);
  const hasVariantChoices = (product.variants?.length ?? 0) > 1;
  const snapshot: CartItem = {
    slug: product.slug,
    name: product.name,
    variant_type: hasVariantChoices ? product.variant_type : null,
    price_dollars: product.price_dollars,
    discounted_price_dollars: product.discounted_price_dollars,
    main_image: product.main_image,
  };
  set(
    cartItemsAtom,
    existing
      ? lines.map((line) =>
          line.item.slug === product.slug
            ? { ...line, quantity: line.quantity + 1 }
            : line
        )
      : [...lines, { item: snapshot, quantity: 1 }]
  );
  set(cartOpenAtom, true);
});

export const setLineQuantityAtom = atom(
  null,
  (get, set, payload: { slug: string; quantity: number }) => {
    const lines = get(cartItemsAtom);
    set(
      cartItemsAtom,
      payload.quantity <= 0
        ? lines.filter((line) => line.item.slug !== payload.slug)
        : lines.map((line) =>
            line.item.slug === payload.slug
              ? { ...line, quantity: payload.quantity }
              : line
          )
    );
  }
);

export const removeLineAtom = atom(null, (get, set, slug: string) => {
  set(
    cartItemsAtom,
    get(cartItemsAtom).filter((line) => line.item.slug !== slug)
  );
});