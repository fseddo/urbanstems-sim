import { QueryClient } from '@tanstack/react-query';
import { productQueries } from '../products/queries';
import { Product } from '@/types/api';

type RouteParams = Record<string, string>;

type PrefetchRoute = {
  pattern: string;
  prefetch: (queryClient: QueryClient, params: RouteParams) => void;
};

/**
 * Preloads images into browser cache
 */
const preloadImages = (urls: (string | null | undefined)[]) => {
  urls.forEach((url) => {
    if (url) {
      const img = new Image();
      img.src = url;
    }
  });
};

/**
 * Extracts image URLs from products for preloading
 */
const getProductImageUrls = (products: Product[]) =>
  products.flatMap((p) => [p.main_image, p.hover_image]);

export const prefetchRoutes: PrefetchRoute[] = [
  {
    pattern: '/products/:id',
    prefetch: async (queryClient, { id }) => {
      const product = await queryClient.fetchQuery(productQueries.detail(id));
      if (product) {
        preloadImages([product.main_image, product.hover_image]);
      }
    },
  },
  {
    pattern: '/collections/:slug',
    prefetch: async (queryClient, { slug }) => {
      const data = await queryClient.fetchInfiniteQuery(
        productQueries.infiniteList({ occasion: slug })
      );
      if (data?.pages?.[0]?.data) {
        preloadImages(getProductImageUrls(data.pages[0].data));
      }
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
