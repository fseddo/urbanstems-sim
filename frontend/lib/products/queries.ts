import { Product, ProductFilters } from '@/types/api';
import { paginatedRequest, request } from '../request';
import { queryOptions, infiniteQueryOptions } from '@tanstack/react-query';
import { createQueryParams } from '../createQueryParams';
import { infiniteQueryProps } from '../infiniteQueryProps';

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: ProductFilters) =>
    [...productKeys.lists(), createQueryParams(filters).key] as const,
  infiniteLists: () => [...productKeys.all, 'infinite'] as const,
  infiniteList: (filters: ProductFilters) =>
    [...productKeys.infiniteLists(), createQueryParams(filters).key] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

export const productQueries = {
  list: (filters: ProductFilters) =>
    queryOptions({
      queryKey: productKeys.list(filters),
      queryFn: async () =>
        paginatedRequest<Product>({
          method: 'get',
          path: `/products${createQueryParams(filters).queryString}`,
        }),
    }),

  infiniteList: (filters: ProductFilters) =>
    infiniteQueryOptions({
      queryKey: productKeys.infiniteList(filters),
      queryFn: async ({ pageParam }) =>
        paginatedRequest<Product>({
          method: 'get',
          path: `/products${createQueryParams({ ...filters, page: pageParam }).queryString}`,
        }),
      ...infiniteQueryProps<Error, Product, readonly unknown[]>(),
    }),

  detail: (productId: string) =>
    queryOptions({
      queryKey: productKeys.detail(productId),
      queryFn: async () =>
        request<Product>({
          method: 'get',
          path: `/products/${productId}`,
        }),
    }),
};
