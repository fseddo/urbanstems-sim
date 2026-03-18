import { paginatedRequest } from '../request';
import { queryOptions } from '@tanstack/react-query';
import { createQueryParams } from '../createQueryParams';
import { Review } from './Review';

export type ReviewFilters = {
  product_slug?: string;
};

export const reviewKeys = {
  all: ['reviews'] as const,
  lists: () => [...reviewKeys.all, 'list'] as const,
  list: (filters: ReviewFilters) =>
    [...reviewKeys.lists(), createQueryParams(filters).key] as const,
};

export const reviewQueries = {
  list: (filters: ReviewFilters) =>
    queryOptions({
      queryKey: reviewKeys.list(filters),
      queryFn: async () =>
        paginatedRequest<Review>({
          method: 'get',
          path: `/reviews/${createQueryParams(filters).queryString}`,
        }),
    }),
};
