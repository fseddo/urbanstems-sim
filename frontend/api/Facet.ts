// Shared shape for the project's facets — Category, Collection, Occasion.
// Mirrors the backend's abstract `Facet` model. All three concrete types
// alias this directly.

export interface Facet {
  id: number;
  name: string;
  slug: string;
  image_src: string | null;
  page_title: string | null;
  header_title: string | null;
  header_subtitle: string | null;
  nav_img_src: string | null;
  nav_description: string | null;
}
