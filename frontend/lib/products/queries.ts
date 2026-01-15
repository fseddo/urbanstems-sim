import { Category, Product, ProductFilters } from '@/types/api';
import { baseRequest } from '../request';
import { queryOptions, infiniteQueryOptions } from '@tanstack/react-query';
import { createQueryParams } from '../createQueryParams';

export const productsQueries = (filters: ProductFilters) => {
  const { queryString, key } = createQueryParams(filters);

  return queryOptions({
    queryKey: ['products', key],
    queryFn: async () =>
      baseRequest<Product>({
        method: 'get',
        path: `/products${queryString}`,
      }),
  });
};

export const productsInfiniteQueries = (filters: ProductFilters) => {
  const { queryString, key } = createQueryParams(filters);

  return infiniteQueryOptions({
    queryKey: ['products', 'infinite', key],
    queryFn: async ({ pageParam }) => {
      const path = pageParam || `/products${queryString}`;
      return baseRequest<Product>({
        method: 'get',
        path,
      });
    },
    initialPageParam: `/products${queryString}`,
    //TODO: remove need to split this to extract params
    getNextPageParam: (lastPage) => lastPage.next?.split('/api')[1],
    getPreviousPageParam: (firstPage) => firstPage?.previous?.split('/api')[1],
  });
};
