export enum VariantType {
  Single = 'single',
  Double = 'double',
  triple = 'triple',
}

export interface ProductVariant {
  id: number;
  name: string;
  slug: string;
  variant_type: VariantType;
  main_image: string | null;
  hover_image: string | null;
  delivery_lead_time: number | null;
  badge_text: string | null;
  price_dollars: number | null;
  discounted_price_dollars: number | null;
}
