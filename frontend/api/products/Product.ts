import { Occasion } from '../occasions/Occasion';
import { Category } from './Category';
import { Collection } from './Collection';
import { VariantType, ProductVariant } from './ProductVariant';

export interface Product {
  id: number;
  external_id: string;
  name: string;
  slug: string;
  variant_type: VariantType | null;
  base_name: string;
  url: string;
  price: number | null;
  price_dollars: number | null;
  discounted_price: number | null;
  discounted_price_dollars: number | null;
  main_image: string | null;
  hover_image: string | null;
  blur_data_url: string | null;
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
