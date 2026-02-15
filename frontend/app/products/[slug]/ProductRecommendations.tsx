'use client';

import { HorizontalList } from '@/components/HorizontalList';
import { ProductCard } from '@/components/ProductCard';
import { productsQueries } from '@/lib/products/queries';
import { Product } from '@/types/api';
import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';

export const ProductRecommendations = ({ product }: { product: Product }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: flowerData } = useQuery({
    ...productsQueries({ category: 'flowers' }),
  });

  return (
    <div className='flex flex-col gap-8 p-20'>
      <div className='flex w-full items-end justify-between'>
        <div className='font-crimson text-5xl'>You May Also Like</div>
        <div className='text-sm font-black tracking-widest underline'>
          SHOP ALL
        </div>
      </div>
      <HorizontalList scrollRef={scrollRef}>
        {flowerData?.results?.flatMap((product, idx) =>
          idx < 8
            ? [<ProductCard key={product.id} product={product} fixed />]
            : []
        )}
      </HorizontalList>
    </div>
  );
};
