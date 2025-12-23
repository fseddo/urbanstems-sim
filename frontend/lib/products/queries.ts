import { Product } from '@/types/api';
import { baseRequest } from '../request';
import { queryOptions } from '@tanstack/react-query';

//TODO: add ability to pass in search as props to improve products query options

export const plantsQueries = queryOptions({
  queryKey: ['plantsQuery'],
  queryFn: async () =>
    baseRequest<Product>({
      method: 'get',
      path: '/products?category=plants',
    }),
});

export const flowersQueries = queryOptions({
  queryKey: ['flowersQuery'],
  queryFn: async () =>
    baseRequest<Product>({
      method: 'get',
      path: '/products?category=flowers',
    }),
});
