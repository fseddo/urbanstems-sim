'use client';

import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productQueries } from '@/lib/products/queries';
import { BestSellersHeaderItem } from './BestSellersHeaderItem';
import { ProductCard } from '@/components/ProductCard';
import { HorizontalList } from '@/components/HorizontalList';

const RESULT_LIMIT = 8;

export default () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: plantData } = useQuery(
    productQueries.list({ category: 'plants' })
  );
  const { data: flowerData } = useQuery(
    productQueries.list({ category: 'flowers' })
  );

  const [selectedProductCategory, setSelectedProductCategory] = useState<
    'flowers' | 'plants'
  >('flowers');

  const visibleProducts =
    selectedProductCategory === 'plants' ? plantData?.data : flowerData?.data;

  return (
    <section className='flex w-full flex-col gap-6 py-10 pl-20'>
      <header className='font-crimson text-[52px] font-medium'>
        Shop Our Best Sellers
      </header>

      <div className='flex w-full flex-col pr-20'>
        <div className='flex gap-5 pb-2'>
          {(['flowers', 'plants'] as const).map((item) => (
            <BestSellersHeaderItem
              key={item}
              item={item}
              selected={selectedProductCategory}
              onClick={setSelectedProductCategory}
            />
          ))}
        </div>
        <div className='w-full border-b-1 opacity-40' />
      </div>

      <HorizontalList scrollRef={scrollRef}>
        {visibleProducts?.flatMap(
          (product, idx) =>
            idx < RESULT_LIMIT && (
              <ProductCard key={product.id} product={product} fixed />
            )
        )}
      </HorizontalList>
    </section>
  );
};
