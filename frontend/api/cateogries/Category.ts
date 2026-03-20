export enum CategoryType {
  Flowers = 'flowers',
  Plants = 'plants',
  Gifts = 'gifts',
  Centerpieces = 'centerpieces',
}

export interface Category {
  id: number;
  name: CategoryType;
  slug: string;
  image_src?: string;
  page_title: string | null;
  header_title: string | null;
  header_subtitle: string | null;
}
