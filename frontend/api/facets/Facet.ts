// A Facet is a *dimension of classification* on Product. The project ships
// 5: category, collection, occasion (kind=landing); color, stem_type
// (kind=filter). Mirrors the backend's `Facet` model.

// Literal union of every facet slug. Single source of truth — derive any
// per-facet type/constraint from this rather than enumerating literals
// inline. Adding a 6th facet means updating this union (one place);
// downstream types like `ProductFilters[FacetSlug]` follow automatically.
export type FacetSlug =
  | 'category'
  | 'collection'
  | 'occasion'
  | 'color'
  | 'stem_type';

export type FacetKind = 'landing' | 'filter';

export interface Facet {
  slug: FacetSlug;
  name: string;
  kind: FacetKind;
}
