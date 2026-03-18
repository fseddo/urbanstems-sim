import { paginatedRequest, request } from '../request';
import { queryOptions } from '@tanstack/react-query';
import { Occasion } from './Occasion';

export const occasionKeys = {
  all: ['occasions'] as const,
  lists: () => [...occasionKeys.all, 'list'] as const,
  list: () => [...occasionKeys.lists()] as const,
  details: () => [...occasionKeys.all, 'detail'] as const,
  detail: (slug: string) => [...occasionKeys.details(), slug] as const,
};

export const occasionQueries = {
  list: () =>
    queryOptions({
      queryKey: occasionKeys.list(),
      queryFn: async () =>
        paginatedRequest<Occasion>({
          method: 'get',
          path: '/occasions/',
        }),
    }),

  detail: (slug: string) =>
    queryOptions({
      queryKey: occasionKeys.detail(slug),
      queryFn: async () =>
        request<Occasion>({
          method: 'get',
          path: `/occasions/${slug}/`,
        }),
    }),
};
