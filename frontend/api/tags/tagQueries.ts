import { queryOptions } from '@tanstack/react-query';
import { createQueryParams } from '../createQueryParams';
import { request } from '../request';
import type { Tag } from './Tag';

export const tagKeys = {
  all: ['tags'] as const,
  lists: () => [...tagKeys.all, 'list'] as const,
  // List, optionally scoped to one facet via ?facet=<slug>. The factor of
  // facet slug into the key means switching facets re-fetches; lists without
  // a facet share one cache entry.
  list: (facetSlug?: string) =>
    [...tagKeys.lists(), facetSlug ?? null] as const,
  searches: () => [...tagKeys.all, 'search'] as const,
  // Backend `?search=<term>` matches name (icontains) and restricts to
  // landing-kind tags. Each term gets its own cache entry — typical for an
  // autosuggest where consumers pass the live debounced value.
  search: (term: string) => [...tagKeys.searches(), term] as const,
  details: () => [...tagKeys.all, 'detail'] as const,
  // Detail is by slug only — the backend resolves slug → tag using
  // `facet__kind='landing'` (slug uniqueness only enforced among landing
  // tags). Filter-kind tags are reached via list(facetSlug).
  detail: (slug: string) => [...tagKeys.details(), slug] as const,
};

export const tagQueries = {
  list: (facetSlug?: string) =>
    queryOptions({
      queryKey: tagKeys.list(facetSlug),
      queryFn: () => {
        const { queryString } = createQueryParams(
          facetSlug ? { facet: facetSlug } : {}
        );
        return request<Tag[]>({
          method: 'get',
          path: `/tags/${queryString}`,
        });
      },
    }),

  search: (term: string) =>
    queryOptions({
      queryKey: tagKeys.search(term),
      queryFn: () => {
        const { queryString } = createQueryParams({ search: term });
        return request<Tag[]>({
          method: 'get',
          path: `/tags/${queryString}`,
        });
      },
    }),

  detail: (slug: string) =>
    queryOptions({
      queryKey: tagKeys.detail(slug),
      queryFn: () =>
        request<Tag>({ method: 'get', path: `/tags/${slug}/` }),
    }),
};
