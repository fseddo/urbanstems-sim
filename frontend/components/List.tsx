'use client';

import { productsInfiniteQueries } from '@/lib/products/queries';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { ProductCard } from './ProductCard';

type Props = {
  //   queryOptions: UseInfiniteQueryOptions;
};

export const List = ({}: Props) => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    //TODO: pass in dynamic queryOptions
    ...productsInfiniteQueries({ category: 'flowers' }),
  });

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
        <div className='text-lg'>Loading products...</div>
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

  const products = data?.pages.flatMap((page) => page.results) ?? [];

  return (
    <div className='grid grid-cols-2 gap-4 p-4 lg:grid-cols-3'>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
      {/* Intersection Observer Target */}
      <div ref={observerTarget} className='h-10 w-full' />
    </div>
  );
};
