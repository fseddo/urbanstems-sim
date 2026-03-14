import { Paginated, SortOrder } from '@/api/PaginatedResponse';
import { VariantType } from './ProductVariant';

export type ProductSortKey =
  | 'name'
  | 'price'
  | 'reviews_rating'
  | 'created_at'
  | 'external_id';

export type ProductFilters = Paginated & {
  category?: 'plants' | 'flowers' | 'gifts' | 'centerpieces';
  collection?: string;
  occasion?: string;
  variant_type?: VariantType;
  min_price?: number;
  max_price?: number;
  search?: string;
  sortKey?: ProductSortKey;
  sortOrder?: SortOrder;
};
