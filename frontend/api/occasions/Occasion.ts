export interface Occasion {
  id: number;
  name: string;
  slug: string;
  image_src?: string;
  page_title: string | null;
  header_title: string | null;
  header_subtitle: string | null;
}
