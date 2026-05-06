// The set of filter values that have ≥1 matching product within a given
// scope (the URL's page tag + free-text search). Computed by the backend's
// /products/filter-options/ endpoint and used by the sidebar to hide
// irrelevant options (e.g. "Hydrangea" stem_type on the Plants page).
//
// `facets` is keyed by facet slug; the value is the list of tag slugs in
// that facet that have at least one matching product.

export type FilterOptions = {
  facets: Record<string, string[]>;
  vase_included: boolean;
  price_range: {
    min: number | null;
    max: number | null;
  };
};

// Scope sent to /products/filter-options/. The page's URL tag (one slug
// per landing facet) plus search; user-selected sidebar filters are
// intentionally NOT included so toggling one doesn't make the others
// disappear from the sidebar.
export type FilterOptionsScope = {
  category?: string;
  collection?: string;
  occasion?: string;
  search?: string;
};
