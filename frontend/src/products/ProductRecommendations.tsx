import { productQueries } from '@/api/products/productQueries';
import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { Link } from '@tanstack/react-router';
import { HorizontalList } from '../common/HorizontalList';
import { ProductCard } from '../common/ProductCard';

export const ProductRecommendations = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: flowerData } = useQuery(
    productQueries.list({ category: ['flowers'], size: 8 })
  );

  return (
    <div className='flex flex-col gap-8 p-20'>
      <div className='flex w-full items-end justify-between'>
        <div className='font-crimson text-5xl'>You May Also Like</div>
        <Link
          to='/collections/$slug'
          params={{ slug: 'all' }}
          className='text-sm font-black tracking-widest underline'
        >
          SHOP ALL
        </Link>
      </div>
      <HorizontalList scrollRef={scrollRef}>
        {flowerData?.data?.map((product) => (
          <div key={product.id} className='w-carousel-card shrink-0'>
            <ProductCard product={product} compact />
          </div>
        ))}
      </HorizontalList>
    </div>
  );
};
