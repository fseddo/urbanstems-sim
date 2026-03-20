import { Paginated, SortOrder } from '@/api/PaginatedResponse';
import { CategoryType } from '@/api/cateogries/Category';
import { ProductBadgeText } from './ProductBadgeText';
import { VariantType } from './ProductVariant';

export type ProductSortKey =
  | 'name'
  | 'price'
  | 'reviews_rating'
  | 'created_at'
  | 'external_id';

export type ProductFilters = Paginated & {
  category?: CategoryType;
  collection?: string;
  occasion?: string;
  badge_text?: ProductBadgeText;
  variant_type?: VariantType;
  min_price?: number;
  max_price?: number;
  search?: string;
  sortKey?: ProductSortKey;
  sortOrder?: SortOrder;
};
