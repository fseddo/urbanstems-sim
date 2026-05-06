import { Paginated, SortOrder } from '@/api/PaginatedResponse';
import type { FacetSlug } from '@/api/facets/Facet';
import { ProductBadgeText } from './ProductBadgeText';
import { VariantType } from './ProductVariant';

export type ProductSortKey =
  | 'name'
  | 'price'
  | 'reviews_rating'
  | 'created_at'
  | 'external_id';

// Per-facet multi-select fields are derived from `FacetSlug` so adding a
// new facet on the backend just means updating the FacetSlug union — the
// filter shape follows automatically. Each value is an array of tag slugs;
// createQueryParams serializes as repeated params (`?color=red&color=pink`).
// OR within a facet, AND across facets — matching the backend contract.
export type ProductFilters = Paginated &
  Partial<Record<FacetSlug, string[]>> & {
    // Non-tag (Product-column) filters
    vase_included?: true;
    badge_text?: ProductBadgeText;
    variant_type?: VariantType;
    min_price?: number;
    max_price?: number;
    search?: string;

    sortKey?: ProductSortKey;
    sortOrder?: SortOrder;
  };
