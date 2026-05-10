import { useAtomValue, useSetAtom } from 'jotai';
import { Product } from '@/api/products/Product';
import {
  attachAddonToLineAtom,
  snapshotAddon,
} from '@/src/cart/cartAtoms';
import {
  addPendingGiftAtom,
  addonSelectorAtom,
  setPendingVaseAtom,
} from './addonAtoms';

// Selector ADD-click handler. Routes the click based on the open
// context: cart-line attaches immediately, PDP stashes in pending
// (consumed by `useAddToBagButton` on next ADD TO BAG).

export const useAddAddon = () => {
  const state = useAtomValue(addonSelectorAtom);
  const closeSelector = useSetAtom(addonSelectorAtom);
  const attachToCartLine = useSetAtom(attachAddonToLineAtom);
  const setPendingVase = useSetAtom(setPendingVaseAtom);
  const addPendingGift = useSetAtom(addPendingGiftAtom);

  return (product: Product) => {
    if (!state) return;
    const item = snapshotAddon(product);
    if (state.context.kind === 'cart-line') {
      attachToCartLine({ lineId: state.context.lineId, addon: item });
    } else if (item.addon_type === 'vase') {
      setPendingVase({ parentSlug: state.context.parentSlug, vase: item });
    } else {
      addPendingGift({ parentSlug: state.context.parentSlug, gift: item });
    }
    closeSelector(null);
  };
};
