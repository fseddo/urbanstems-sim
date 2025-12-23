import { Occasion } from '@/types/api';
import { baseRequest } from '../request';
import { queryOptions } from '@tanstack/react-query';

export const occasionsQueries = queryOptions({
  queryKey: ['occasionsQuery'],
  queryFn: async () =>
    baseRequest<Occasion>({
      method: 'get',
      path: '/occasions',
    }),
});
