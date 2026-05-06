// A Tag is a single classification value within a Facet — "Birthday" is a
// tag of the Occasion facet, "Red" is a tag of the Color facet. Landing-page
// metadata fields and `hex` are nullable per facet kind:
//   - landing facets (cat/col/occ) populate image_src / page_title / header_* /
//     nav_*; `hex` is null
//   - filter facets (color/stem_type) populate slug + name only; color tags
//     additionally populate `hex`

import type { Facet } from '../facets/Facet';

export interface Tag {
  id: number;
  slug: string;
  name: string;
  facet: Facet;
  image_src: string | null;
  page_title: string | null;
  header_title: string | null;
  header_subtitle: string | null;
  nav_img_src: string | null;
  nav_description: string | null;
  hex: string | null;
}
