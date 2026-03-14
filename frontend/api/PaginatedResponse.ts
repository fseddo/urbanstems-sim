export interface PaginatedResponse<T> {
  page: number;
  size: number;
  total: number;
  data: T[];
}

export type SortOrder = 'asc' | 'desc';

export type Paginated = {
  page?: number;
  size?: number;
};
