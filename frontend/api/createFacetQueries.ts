import { queryOptions } from '@tanstack/react-query';
import { request } from './request';

// Build the standard `<resource>Keys` + `<resource>Queries` pair for a
// facet — the project's term for a dimension of classification on Product
// (Category, Collection, Occasion). The backend's `Facet` abstract model
// is the contract: a list endpoint at `/<resource>/` returning all tags
// in the facet, and a slug-keyed detail at `/<resource>/<slug>/` for one
// tag.
//
// Use this factory only for facets. Anything with bespoke behavior
// (filters, pagination, infinite queries, content-keyed POSTs) belongs
// in a hand-rolled `<resource>Queries.ts`.

export const createFacetQueries = <T>(resource: string) => {
  const keys = {
    all: [resource] as const,
    lists: () => [...keys.all, 'list'] as const,
    list: () => [...keys.lists()] as const,
    details: () => [...keys.all, 'detail'] as const,
    detail: (slug: string) => [...keys.details(), slug] as const,
  };

  const queries = {
    list: () =>
      queryOptions({
        queryKey: keys.list(),
        queryFn: () =>
          request<T[]>({ method: 'get', path: `/${resource}/` }),
      }),
    detail: (slug: string) =>
      queryOptions({
        queryKey: keys.detail(slug),
        queryFn: () =>
          request<T>({ method: 'get', path: `/${resource}/${slug}/` }),
      }),
  };

  return { keys, queries };
};
