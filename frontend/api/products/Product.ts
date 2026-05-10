import { ProductBadgeText } from './ProductBadgeText';
import { VariantType, ProductVariant } from './ProductVariant';
import { AddonType } from './AddonType';
import { Tag } from '../tags/Tag';

export interface Product {
  id: number;
  external_id: string;
  name: string;
  slug: string;
  subtitle: string | null;
  variant_type: VariantType | null;
  base_name: string;
  url: string | null;
  price: number | null;
  price_dollars: number | null;
  discounted_price: number | null;
  discounted_price_dollars: number | null;
  main_image: string | null;
  hover_image: string | null;
  blur_data_url: string | null;
  badge_text: ProductBadgeText | null;
  badge_image_src: string | null;
  delivery_lead_time: number | null;
  stock: number;
  reviews_rating: number | null;
  reviews_count: number | null;
  description: string | null;
  care_instructions: string | null;
  main_detail_src: string | null;
  is_main_detail_video: boolean;
  detail_image_1_src: string | null;
  detail_image_2_src: string | null;
  // True when the bouquet ships with its own vase/vessel (derived at seed
  // time from product text). Gated by `isVaseAddonEligible`.
  vase_included: boolean;
  addon_type: AddonType | null;
  variants: ProductVariant[];
  // Only present on detail responses; list responses omit it.
  tags?: Tag[];
  created_at: string;
  updated_at?: string;
}

// Whether this product can take a vase add-on. Snapshot at add-to-cart
// time so the cart never re-derives. Caller contract: pass a detail-shaped
// Product (tags loaded) — under-offers if tags are missing rather than
// risking a vase offer on a plant.
export const isVaseAddonEligible = (product: Product): boolean => {
  if (product.vase_included) return false;
  if (
    product.tags?.some(
      (tag) => tag.slug === 'plants' && tag.facet.slug === 'category'
    )
  )
    return false;
  return true;
};
