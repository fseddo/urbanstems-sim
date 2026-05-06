// Helpers for translating the /collections/$slug URL + sidebar selections
// into the right shape for the products query layer. Pure functions — no
// React, no router. The slug-to-tag resolution itself happens via
// `tagQueries.detail(slug)` in the route loader; this file just merges
// the resolved page tag with the user's UIFilters selections.

import { FilterOptionsScope } from '@/api/products/FilterOptions';
import { ProductFilters } from '@/api/products/ProductFilters';
import type { Tag } from '@/api/tags/Tag';
import { UIFilters } from '@/src/filters/filterSpecs';

export type RouteSearch = UIFilters & { search?: string };

// Build the full filter object for /api/products/. Combines the URL-derived
// page tag (when present) with UIFilters (sidebar selections). The page
// tag's slug is prepended into the existing facet list so the API query
// returns products matching the URL tag AND any sidebar selections.
//
// `pageTag.facet.slug` is typed as FacetSlug, which is exactly the subset
// of `keyof ProductFilters` that maps to `string[]` — so no casts needed.
export const buildFilters = (
  pageTag: Tag | null,
  routeSearch: RouteSearch
): ProductFilters => {
  const { search: searchStr, ...uiFilters } = routeSearch;
  const base: ProductFilters = {
    ...uiFilters,
    ...(searchStr ? { search: searchStr } : {}),
  };
  if (!pageTag) return base;
  const facetSlug = pageTag.facet.slug;
  const existing = base[facetSlug] ?? [];
  return { ...base, [facetSlug]: [pageTag.slug, ...existing] };
};

// Scope sent to /products/filter-options/. Just the URL page tag + search;
// user-selected sidebar filters are intentionally NOT included so toggling
// one doesn't make the others vanish from the sidebar.
export const buildFilterOptionsScope = (
  pageTag: Tag | null,
  search: string | undefined
): FilterOptionsScope => {
  const base = search ? { search } : {};
  if (!pageTag) return base;
  return { ...base, [pageTag.facet.slug]: pageTag.slug };
};
