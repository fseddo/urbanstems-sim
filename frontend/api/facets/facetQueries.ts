import { queryOptions } from '@tanstack/react-query';
import { request } from '../request';
import type { Facet } from './Facet';

export const facetKeys = {
  all: ['facets'] as const,
  lists: () => [...facetKeys.all, 'list'] as const,
  list: () => [...facetKeys.lists()] as const,
};

export const facetQueries = {
  list: () =>
    queryOptions({
      queryKey: facetKeys.list(),
      queryFn: () => request<Facet[]>({ method: 'get', path: '/facets/' }),
    }),
};
