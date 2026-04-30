import { paginatedRequest, request } from '../request';
import { queryOptions, infiniteQueryOptions } from '@tanstack/react-query';
import { createQueryParams } from '../createQueryParams';
import { toApiSortParams } from '../toApiSortParams';
import { infiniteQueryProps } from '../infiniteQueryProps';
import { ProductFilters } from './ProductFilters';
import { Product } from './Product';
import { FilterOptions, FilterOptionsScope } from './FilterOptions';

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: ProductFilters) =>
    [...productKeys.lists(), createQueryParams(toApiSortParams(filters)).key] as const,
  infiniteLists: () => [...productKeys.all, 'infinite'] as const,
  infiniteList: (filters: ProductFilters) =>
    [...productKeys.infiniteLists(), createQueryParams(toApiSortParams(filters)).key] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  filterOptions: (scope: FilterOptionsScope) =>
    [...productKeys.all, 'filter-options', createQueryParams(scope).key] as const,
};

export const productQueries = {
  list: (filters: ProductFilters) =>
    queryOptions({
      queryKey: productKeys.list(filters),
      queryFn: async () =>
        paginatedRequest<Product>({
          method: 'get',
          path: `/products/${createQueryParams(toApiSortParams(filters)).queryString}`,
        }),
    }),

  infiniteList: (filters: ProductFilters) =>
    infiniteQueryOptions({
      queryKey: productKeys.infiniteList(filters),
      queryFn: async ({ pageParam }) =>
        paginatedRequest<Product>({
          method: 'get',
          path: `/products/${createQueryParams({ ...toApiSortParams(filters), page: pageParam }).queryString}`,
        }),
      ...infiniteQueryProps<Error, Product, readonly unknown[]>(),
    }),

  detail: (slug: string) =>
    queryOptions({
      queryKey: productKeys.detail(slug),
      queryFn: async () =>
        request<Product>({
          method: 'get',
          path: `/products/${slug}/`,
        }),
    }),

  filterOptions: (scope: FilterOptionsScope) =>
    queryOptions({
      queryKey: productKeys.filterOptions(scope),
      queryFn: async () =>
        request<FilterOptions>({
          method: 'get',
          path: `/products/filter-options/${createQueryParams(scope).queryString}`,
        }),
    }),
};
