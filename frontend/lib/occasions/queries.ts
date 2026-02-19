import { Occasion } from '@/types/api';
import { paginatedRequest } from '../request';
import { queryOptions } from '@tanstack/react-query';

export const occasionKeys = {
  all: ['occasions'] as const,
  lists: () => [...occasionKeys.all, 'list'] as const,
  list: () => [...occasionKeys.lists()] as const,
};

export const occasionQueries = {
  list: () =>
    queryOptions({
      queryKey: occasionKeys.list(),
      queryFn: async () =>
        paginatedRequest<Occasion>({
          method: 'get',
          path: '/occasions',
        }),
    }),
};
