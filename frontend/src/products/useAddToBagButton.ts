import { useAtomValue, useSetAtom } from 'jotai';
import { Product } from '@/api/products/Product';
import { CartItem, addToCartAtom } from '@/src/cart/cartAtoms';
import {
  clearPendingForProductAtom,
  pendingAddonsAtom,
} from '@/src/addons/addonAtoms';

// Bundles pending add-on selections for `product` into the new cart line
// and clears pending on add. Shared by the in-flow PDP button and the
// sticky `ProductBottomBar` button so the bundled price + add-clear
// behavior stays in one place.

export const useAddToBagButton = (product: Product) => {
  const pending =
    useAtomValue(pendingAddonsAtom)[product.slug] ?? { gifts: [] };
  const addToCart = useSetAtom(addToCartAtom);
  const clearPending = useSetAtom(clearPendingForProductAtom);

  const addons: CartItem[] = [
    ...(pending.vase ? [pending.vase] : []),
    ...pending.gifts,
  ];
  const setPrice =
    (product.price_dollars ?? 0) +
    addons.reduce((s, a) => s + a.price_dollars, 0);

  const addToBag = () => {
    addToCart({ product, addons });
    if (addons.length > 0) clearPending(product.slug);
  };

  return { setPrice, addonCount: addons.length, addToBag };
};
