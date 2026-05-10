import { AddonType } from '@/api/products/AddonType';

interface AddonTypeMeta {
  rowSubtitle: string;
  rowThumbnail: string;
  modalTitle: string;
  modalSubtitle: string;
}

// Per-type UI copy + thumbnails. Keyed on `AddonType` so a new addon type
// flags a TS error at every consumer. Tracked for migration to Tag rows —
// see `docs/improvements/backend.md` → "Tag schema consolidation".
export const ADDON_TYPE_META: Record<AddonType, AddonTypeMeta> = {
  vase: {
    rowSubtitle: 'Enhance Your Bouquet With The Perfect Vase',
    rowThumbnail:
      'https://urbanstems.com/cdn/shop/files/HavenVase_MainImage_PDP.jpg?v=1776356779',
    modalTitle: 'Vases',
    modalSubtitle: 'Add the Perfect Touch with a Vase',
  },
  gift: {
    rowSubtitle: 'New Premium Add Ons Available',
    rowThumbnail:
      'https://urbanstems.com/cdn/shop/files/LemonPoppy_Cookies_MainImage_PDP.jpg?v=1770480201',
    modalTitle: 'Gifts',
    modalSubtitle: 'Add the Perfect Touch with a Gift',
  },
};

// "Add A Vase" / "Add A Gift" — used by PDP rows and the cart-line trigger.
export const addonCtaLabel = (type: AddonType): string =>
  `Add A ${type.charAt(0).toUpperCase()}${type.slice(1)}`;
