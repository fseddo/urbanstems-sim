'use client';

import {
  useInfiniteQuery,
  UseInfiniteQueryOptions,
} from '@tanstack/react-query';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { ReactNode, useEffect, useState, useCallback, useRef } from 'react';
import { PaginatedResponse } from '@/types/api';

type Props<T> = {
  queryOptions: UseInfiniteQueryOptions<
    PaginatedResponse<T>,
    Error,
    T[],
    any,
    any
  >;
  renderItem: (item: T, index: number) => ReactNode;
  /** Estimated height of each row in pixels */
  estimateRowHeight?: number;
};

const useColumns = () => {
  const [columns, setColumns] = useState(3);

  useEffect(() => {
    const updateColumns = () => {
      // Match Tailwind breakpoints: lg:grid-cols-3, default grid-cols-2
      setColumns(window.innerWidth >= 1024 ? 3 : 2);
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  return columns;
};

export const List = <T,>({
  queryOptions,
  renderItem,
  estimateRowHeight = 600,
}: Props<T>) => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery(queryOptions);

  const columns = useColumns();
  const items = data ?? [];
  const rowCount = Math.ceil(items.length / columns);
  const listRef = useRef<HTMLDivElement>(null);

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => estimateRowHeight,
    overscan: 2,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  });

  const virtualRows = virtualizer.getVirtualItems();

  // Fetch more when scrolling near the end
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

  const getRowItems = useCallback(
    (rowIndex: number) => {
      const startIndex = rowIndex * columns;
      return items.slice(startIndex, startIndex + columns);
    },
    [items, columns]
  );

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
        <div className='text-lg text-red-600'>
          Error: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    );
  }

  if (!isLoading && items.length < 1) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='text-lg'>No results found</div>
      </div>
    );
  }

  return (
    <div ref={listRef} className='w-full'>
      <div
        className='relative w-full'
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualRows.map((virtualRow) => {
          const rowItems = getRowItems(virtualRow.index);
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className='absolute left-0 right-0 grid grid-cols-2 gap-4 px-12 py-2 lg:grid-cols-3'
              style={{
                transform: `translateY(${virtualRow.start - virtualizer.options.scrollMargin}px)`,
              }}
            >
              {rowItems.map((item, colIndex) => (
                <div key={virtualRow.index * columns + colIndex}>
                  {renderItem(item, virtualRow.index * columns + colIndex)}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
