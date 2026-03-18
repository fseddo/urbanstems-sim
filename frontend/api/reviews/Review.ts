export interface Review {
  id: number;
  external_id: string;
  product_slug: string;
  reviewer_name: string;
  is_verified_buyer: boolean;
  rating: number;
  title: string | null;
  body: string | null;
  date: string;
}