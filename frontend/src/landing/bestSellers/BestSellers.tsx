import { useRef, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { productQueries } from '@/api/products/queries';
import { BestSellersHeaderItem } from './BestSellersHeaderItem';
import { HorizontalList } from '@/src/common/HorizontalList';
import { ProductCard } from '@/src/common/ProductCard';
import { CategoryType } from '@/api/cateogries/Category';

const RESULT_LIMIT = 8;

export default () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [category, setCategory] = useState<CategoryType>(CategoryType.Flowers);

  const { data: productData } = useQuery({
    ...productQueries.list({ category }),
    placeholderData: keepPreviousData,
  });

  return (
    <section className='flex w-full flex-col gap-6 py-10 pl-20'>
      <header className='font-crimson text-[52px] font-medium'>
        Shop Our Best Sellers
      </header>

      <div className='flex w-full flex-col pr-20'>
        <div className='flex gap-5 pb-2'>
          {([CategoryType.Flowers, CategoryType.Plants] as const).map(
            (item) => (
              <BestSellersHeaderItem
                key={item}
                item={item}
                selected={category}
                onClick={setCategory}
              />
            )
          )}
        </div>
        <div className='w-full border-b opacity-40' />
      </div>

      <HorizontalList scrollRef={scrollRef}>
        {productData?.data.flatMap(
          (product, idx) =>
            idx < RESULT_LIMIT && (
              <ProductCard key={product.id} product={product} fixed />
            )
        )}
      </HorizontalList>
    </section>
  );
};
