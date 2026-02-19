import { QueryClient } from '@tanstack/react-query';
import { productQueries } from '../products/queries';
import { ProductFilters } from '@/types/api';

type RouteParams = Record<string, string>;

type PrefetchRoute = {
  pattern: string;
  prefetch: (queryClient: QueryClient, params: RouteParams) => void;
};

const CATEGORIES = ['flowers', 'plants', 'gifts', 'centerpieces'] as const;
type Category = (typeof CATEGORIES)[number];

const isCategory = (slug: string): slug is Category =>
  CATEGORIES.includes(slug as Category);

const getCollectionFilters = (slug: string): ProductFilters => {
  if (slug === 'all') return {};
  if (isCategory(slug)) return { category: slug };
  return { occasion: slug };
};

export const prefetchRoutes: PrefetchRoute[] = [
  {
    pattern: '/products/:id',
    prefetch: (queryClient, { id }) => {
      queryClient.prefetchQuery(productQueries.detail(id));
    },
  },
  {
    pattern: '/collections/:slug',
    prefetch: (queryClient, { slug }) => {
      queryClient.prefetchInfiniteQuery(
        productQueries.infiniteList(getCollectionFilters(slug))
      );
    },
  },
];

/**
 * Matches a URL path against a route pattern and extracts params.
 * Pattern: '/products/:id' matches '/products/123' -> { id: '123' }
 */
export const matchRoute = (
  path: string,
  pattern: string
): RouteParams | null => {
  const pathParts = path.split('/').filter(Boolean);
  const patternParts = pattern.split('/').filter(Boolean);

  if (pathParts.length !== patternParts.length) {
    return null;
  }

  const params: RouteParams = {};

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    if (patternPart.startsWith(':')) {
      params[patternPart.slice(1)] = pathPart;
    } else if (patternPart !== pathPart) {
      return null;
    }
  }

  return params;
};

/**
 * Finds the matching prefetch route for a given path.
 */
export const findPrefetchRoute = (path: string) => {
  for (const route of prefetchRoutes) {
    const params = matchRoute(path, route.pattern);
    if (params) {
      return { route, params };
    }
  }
  return null;
};
