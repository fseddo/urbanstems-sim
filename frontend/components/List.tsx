'use client';

import {
  useInfiniteQuery,
  UseInfiniteQueryOptions,
} from '@tanstack/react-query';
import { ReactNode, useEffect, useRef } from 'react';
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
};

export const List = <T,>({ queryOptions, renderItem }: Props<T>) => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery(queryOptions);

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.7 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

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

  if (!isLoading && (data?.length ?? 0) < 1) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='text-lg'>No results found</div>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-2 gap-4 p-4 px-12 lg:grid-cols-3'>
      {data?.map((item, index) => renderItem(item, index))}
      {/* Intersection Observer Target */}
      <div ref={observerTarget} className='h-10 w-full' />
    </div>
  );
};
