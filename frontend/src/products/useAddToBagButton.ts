import { useAtomValue, useSetAtom } from 'jotai';
import { Product } from '@/api/products/Product';
import { addToCartAtom } from '@/src/cart/cartAtoms';
import {
  clearPendingForProductAtom,
  pendingAddonsAtom,
} from '@/src/addons/addonAtoms';

// Bundles pending add-ons for `product` into the next ADD TO BAG. Vase
// attaches to the bouquet's set line; gifts split into their own
// independent cart lines (each gift's `count` becomes that line's
// quantity). Pending is cleared after the add.
//
// `setPrice` reflects the bundled total — bouquet + vase + (gift price ×
// count) — so the button reads as the user's total intent at click time,
// even though gifts will end up as separate cart lines.

export const useAddToBagButton = (product: Product) => {
  const pending =
    useAtomValue(pendingAddonsAtom)[product.slug] ?? { gifts: [] };
  const addToCart = useSetAtom(addToCartAtom);
  const clearPending = useSetAtom(clearPendingForProductAtom);

  const giftSum = pending.gifts.reduce(
    (s, g) => s + g.item.price_dollars * g.count,
    0
  );
  const setPrice =
    (product.price_dollars ?? 0) +
    (pending.vase?.price_dollars ?? 0) +
    giftSum;
  const addonCount =
    (pending.vase ? 1 : 0) +
    pending.gifts.reduce((s, g) => s + g.count, 0);

  const addToBag = () => {
    addToCart({
      product,
      vase: pending.vase,
      gifts: pending.gifts,
    });
    if (addonCount > 0) clearPending(product.slug);
  };

  return { setPrice, addonCount, addToBag };
};
