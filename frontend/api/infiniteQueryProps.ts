import { PaginatedResponse } from '@/api/PaginatedResponse';
import {
  DefinedInitialDataInfiniteOptions,
  InfiniteData,
  QueryKey,
} from '@tanstack/react-query';

// `staleTime: Infinity` is intentional for infinite queries. Pages are
// accumulated as the user scrolls; a background refetch would either drop
// the user's scroll position or merge new data into existing pages, both
// of which are surprising. Consumers can override per-call if they need
// fresher data.
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
