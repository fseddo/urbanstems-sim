import { Category, Product, ProductFilters } from '@/types/api';
import { baseRequest } from '../request';
import { queryOptions } from '@tanstack/react-query';
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
