export interface Category {
  id: number;
  name: string;
  slug: string;
  image_src?: string;
}

export interface Collection {
  id: number;
  name: string;
  slug: string;
}

export interface Occasion {
  id: number;
  name: string;
  slug: string;
  image_src?: string;
}

export enum VariantType {
  Single = 'single',
  Double = 'double',
  triple = 'triple',
}

export interface ProductVariant {
  id: number;
  name: string;
  variant_type: VariantType;
  main_image: string | null;
  hover_image: string | null;
  delivery_lead_time: number | null;
  badge_text: string | null;
  price_dollars: number | null;
  discounted_price_dollars: number | null;
}

export interface Product {
  id: number;
  external_id: string;
  name: string;
  variant_type: VariantType | null;
  base_name: string;
  url: string;
  price: number | null;
  price_dollars: number | null;
  discounted_price: number | null;
  discounted_price_dollars: number | null;
  main_image: string | null;
  hover_image: string | null;
  badge_text: string | null;
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
  categories?: Category[];
  collections?: Collection[];
  occasions?: Occasion[];
  variants: ProductVariant[];
  created_at: string;
  updated_at?: string;
}

export interface PaginatedResponse<T> {
  page: number;
  size: number;
  total: number;
  data: T[];
}

export type ProductSortKey =
  | 'name'
  | 'price'
  | 'reviews_rating'
  | 'created_at'
  | 'external_id';

export type SortOrder = 'asc' | 'desc';

export type Paginated = {
  page?: number;
  size?: number;
};

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
