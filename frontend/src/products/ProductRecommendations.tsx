import { productQueries } from '@/api/products/productQueries';
import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { Link } from '@tanstack/react-router';
import { HorizontalList } from '../common/components/HorizontalList';
import { ProductCard } from '../common/components/ProductCard';

export const ProductRecommendations = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: flowerData } = useQuery(
    productQueries.list({ category: ['flowers'], size: 8 })
  );

  return (
    <section className='py-pdp-section pl-page flex w-full flex-col gap-6 md:gap-8 lg:gap-10'>
      <div className='pr-page flex w-full items-end justify-between leading-none'>
        <div className='font-crimson text-landing-section-header font-medium'>
          You May Also Like
        </div>
        <Link
          to='/collections/$slug'
          params={{ slug: 'all' }}
          className='tracking-action mb-1.5 min-w-[75px] text-[12px] font-extrabold underline underline-offset-4 lg:text-[14px]'
        >
          SHOP ALL
        </Link>
      </div>
      <HorizontalList
        scrollRef={scrollRef}
        className='gap-2 lg:gap-4'
        outerClassName='gap-10 lg:gap-14'
        scrollbar={{ width: 'w-[50%]' }}
      >
        {flowerData?.data?.map((product) => (
          <div key={product.id} className='w-carousel-card shrink-0'>
            <ProductCard product={product} compact />
          </div>
        ))}
      </HorizontalList>
    </section>
  );
};
