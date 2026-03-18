import { request } from '../request';
import { queryOptions } from '@tanstack/react-query';
import { Collection } from './Collection';

export const collectionKeys = {
  all: ['collections'] as const,
  details: () => [...collectionKeys.all, 'detail'] as const,
  detail: (slug: string) => [...collectionKeys.details(), slug] as const,
};

export const collectionQueries = {
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
