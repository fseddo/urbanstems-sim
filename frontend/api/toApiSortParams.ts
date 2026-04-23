import { SortOrder } from './PaginatedResponse';

type SortableParams = { sortKey?: string; sortOrder?: SortOrder };

export const toApiSortParams = <T extends SortableParams>(params: T) => {
  const { sortKey, sortOrder, ...rest } = params;
  return {
    ...rest,
    ...(sortKey && { ordering: sortOrder === 'desc' ? `-${sortKey}` : sortKey }),
  };
};
