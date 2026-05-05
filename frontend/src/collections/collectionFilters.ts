// Helpers for translating a /collections/$slug URL into the right filter
// shape for the products query layer. Pure functions — no React, no router.

import { CategoryType } from '@/api/categories/Category';
import type { Category } from '@/api/categories/Category';
import type { Collection } from '@/api/collections/Collection';
import type { Occasion } from '@/api/occasions/Occasion';
import { FilterOptionsScope } from '@/api/products/FilterOptions';
import { ProductFilters } from '@/api/products/ProductFilters';
import { UIFilters } from '@/src/filters/filterSpecs';

export type SlugType = 'all' | 'category' | 'collection' | 'occasion';

export type RouteSearch = UIFilters & { search?: string };

// Returns the slug's taxonomy bucket, or `null` when the slug doesn't match
// any known category / collection / occasion. The route loader is expected
// to redirect to `/collections/all` on null — otherwise downstream queries
// would 404 with no recovery.
export const getSlugType = (
  slug: string,
  categories: Category[],
  collections: Collection[],
  occasions: Occasion[]
): SlugType | null => {
  if (slug === 'all') return 'all';
  if (categories.some((c) => c.slug === slug)) return 'category';
  if (collections.some((c) => c.slug === slug)) return 'collection';
  if (occasions.some((o) => o.slug === slug)) return 'occasion';
  return null;
};

export const buildFilterOptionsScope = (
  slug: string,
  slugType: SlugType,
  search: string | undefined
): FilterOptionsScope => {
  const base = search ? { search } : {};
  switch (slugType) {
    case 'all':
      return base;
    case 'category':
      return { ...base, category: slug };
    case 'collection':
      return { ...base, collection: slug };
    case 'occasion':
      return { ...base, occasion: slug };
  }
};

export const buildFilters = (
  slug: string,
  slugType: SlugType,
  routeSearch: RouteSearch
): ProductFilters => {
  const { search: searchStr, ...uiFilters } = routeSearch;
  const base: ProductFilters = {
    ...uiFilters,
    ...(searchStr ? { search: searchStr } : {}),
  };
  switch (slugType) {
    case 'all':
      return base;
    case 'category':
      return { ...base, category: slug as CategoryType };
    case 'collection':
      return { ...base, collection: slug };
    case 'occasion':
      return { ...base, occasion: slug };
  }
};
