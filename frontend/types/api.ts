export interface Category {
  id: number;
  name: string;
  slug: string;
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
}

export interface Product {
  id: number;
  external_id: string;
  name: string;
  variant_type: 'single' | 'double' | 'triple' | null;
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
  created_at: string;
  updated_at?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ProductFilters {
  category?: string;
  collection?: string;
  occasion?: string;
  variant_type?: 'single' | 'double' | 'triple';
  min_price?: number;
  max_price?: number;
  search?: string;
  ordering?: string;
}
