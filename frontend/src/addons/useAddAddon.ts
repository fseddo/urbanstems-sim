import { useAtomValue, useSetAtom } from 'jotai';
import { Product } from '@/api/products/Product';
import {
  setLineVaseAtom,
  snapshotAddon,
} from '@/src/cart/cartAtoms';
import {
  addonSelectorAtom,
  incrementPendingGiftAtom,
  setPendingVaseAtom,
} from './addonAtoms';

// Selector ADD-click handler. Routes by atom context:
//   vase + cart-line → setLineVaseAtom (immediate; replaces existing vase)
//   vase + pdp       → setPendingVaseAtom (consumed by next ADD TO BAG)
//   gift + pdp       → incrementPendingGiftAtom (count-based stash)
// gift + cart-line is unreachable — gifts are independent cart lines and
// have no cart-line trigger.

export const useAddAddon = () => {
  const state = useAtomValue(addonSelectorAtom);
  const closeSelector = useSetAtom(addonSelectorAtom);
  const setLineVase = useSetAtom(setLineVaseAtom);
  const setPendingVase = useSetAtom(setPendingVaseAtom);
  const incrementPendingGift = useSetAtom(incrementPendingGiftAtom);

  return (product: Product) => {
    if (!state) return;
    const item = snapshotAddon(product);
    if (state.context.kind === 'cart-line') {
      // Cart-line context only fires for vase triggers.
      setLineVase({ lineId: state.context.lineId, vase: item });
      closeSelector(null);
      return;
    }
    // PDP context.
    if (state.type === 'vase') {
      setPendingVase({ parentSlug: state.context.parentSlug, vase: item });
      closeSelector(null);
    } else {
      // Gift increment — leave the modal open so the user can keep tapping.
      incrementPendingGift({
        parentSlug: state.context.parentSlug,
        gift: item,
      });
    }
  };
};
