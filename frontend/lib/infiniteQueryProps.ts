import { PaginatedResponse } from '@/types/api';
import {
  DefinedInitialDataInfiniteOptions,
  InfiniteData,
  QueryKey,
} from '@tanstack/react-query';

export const infiniteQueryProps = <
  TError,
  TSchema,
  TQueryKey extends QueryKey,
>(props?: {
  predicate?: (item: TSchema) => boolean;
}) =>
  ({
    staleTime: Infinity,
    initialPageParam: 1,
    getNextPageParam({ page, size, total }) {
      return page * size < total ? page + 1 : undefined;
    },
    getPreviousPageParam({ page }) {
      return page > 1 ? page - 1 : undefined;
    },
    select(data: InfiniteData<PaginatedResponse<TSchema>>) {
      const items = data.pages.flatMap((page) => page.data);
      return props?.predicate ? items.filter(props.predicate) : items;
    },
  }) as const satisfies Pick<
    DefinedInitialDataInfiniteOptions<
      PaginatedResponse<TSchema>,
      TError,
      Array<TSchema>,
      TQueryKey,
      number
    >,
    | 'staleTime'
    | 'initialPageParam'
    | 'getNextPageParam'
    | 'select'
    | 'getPreviousPageParam'
    | 'placeholderData'
  >;
