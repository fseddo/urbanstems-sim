import {
  useInfiniteQuery,
  UseInfiniteQueryOptions,
} from '@tanstack/react-query';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import {
  ReactNode,
  useEffect,
  useLayoutEffect,
  useState,
  useRef,
} from 'react';
import { PaginatedResponse } from '@/api/PaginatedResponse';
import { prefetchImages } from './utils/prefetchImages';

export type ColumnCount = 1 | 2 | 3 | 4;

type Props<T, TQueryKey extends readonly unknown[] = readonly unknown[]> = {
  queryOptions: UseInfiniteQueryOptions<
    PaginatedResponse<T>,
    Error,
    T[],
    TQueryKey,
    number
  >;
  renderItem: (item: T, index: number) => ReactNode;
  columnCount: ColumnCount;
  estimateRowHeight?: number;
  getItemImageUrls?: (item: T) => string[];
};

export const List = <
  T,
  TQueryKey extends readonly unknown[] = readonly unknown[],
>({
  queryOptions,
  renderItem,
  columnCount,
  estimateRowHeight = 600,
  getItemImageUrls,
}: Props<T, TQueryKey>) => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery(queryOptions);

  const items = data ?? [];
  const rowCount = Math.ceil(items.length / columnCount);
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    if (listRef.current) {
      setScrollMargin(listRef.current.offsetTop);
    }
  }, []);

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => estimateRowHeight,
    overscan: 5,
    scrollMargin,
    initialOffset: 0,
  });

  const virtualRows = virtualizer.getVirtualItems();

  const lastRow = virtualRows[virtualRows.length - 1];
  const shouldFetchMore =
    lastRow &&
    lastRow.index >= rowCount - 2 &&
    hasNextPage &&
    !isFetchingNextPage;

  useEffect(() => {
    if (shouldFetchMore) {
      fetchNextPage();
    }
  }, [shouldFetchMore, fetchNextPage]);

  useEffect(() => {
    if (!getItemImageUrls) return;
    prefetchImages(items.flatMap((item) => getItemImageUrls(item)));
  }, [items, getItemImageUrls]);

  const getRowItems = (rowIndex: number) => {
    const startIndex = rowIndex * columnCount;
    return items.slice(startIndex, startIndex + columnCount);
  };

  if (isLoading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='text-lg'>Loading...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='text-error text-lg'>
          Error: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    );
  }

  if (items.length < 1) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='text-lg'>No results found</div>
      </div>
    );
  }

  return (
    <div ref={listRef} className='pt-15'>
      <div className='relative' style={{ height: virtualizer.getTotalSize() }}>
        {virtualRows.map((virtualRow) => {
          const rowItems = getRowItems(virtualRow.index);
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className='absolute right-0 left-0 grid gap-4 px-[clamp(0.5rem,2vw,3rem)] py-2'
              style={{
                gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
                transform: `translateY(${virtualRow.start - virtualizer.options.scrollMargin}px)`,
              }}
            >
              {rowItems.map((item, colIndex) => (
                <div key={virtualRow.index * columnCount + colIndex}>
                  {renderItem(item, virtualRow.index * columnCount + colIndex)}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
