import { request } from '../request';
import { queryOptions } from '@tanstack/react-query';
import { Collection } from './Collection';

export const collectionKeys = {
  all: ['collections'] as const,
  lists: () => [...collectionKeys.all, 'list'] as const,
  list: () => [...collectionKeys.lists()] as const,
  details: () => [...collectionKeys.all, 'detail'] as const,
  detail: (slug: string) => [...collectionKeys.details(), slug] as const,
};

export const collectionQueries = {
  list: () =>
    queryOptions({
      queryKey: collectionKeys.list(),
      queryFn: async () =>
        request<Collection[]>({
          method: 'get',
          path: '/collections/',
        }),
    }),

  detail: (slug: string) =>
    queryOptions({
      queryKey: collectionKeys.detail(slug),
      queryFn: async () =>
        request<Collection>({
          method: 'get',
          path: `/collections/${slug}/`,
        }),
    }),
};
