import { request } from '../request';
import { queryOptions } from '@tanstack/react-query';
import { Category } from './Category';

export const categoryKeys = {
  all: ['categories'] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (slug: string) => [...categoryKeys.details(), slug] as const,
};

export const categoryQueries = {
  detail: (slug: string) =>
    queryOptions({
      queryKey: categoryKeys.detail(slug),
      queryFn: async () =>
        request<Category>({
          method: 'get',
          path: `/categories/${slug}/`,
        }),
    }),
};
