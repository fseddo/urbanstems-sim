import { useRef, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { productQueries } from '@/api/products/productQueries';
import { BestSellersHeaderItem } from './BestSellersHeaderItem';
import { HorizontalList } from '@/src/common/HorizontalList';
import { ProductCard } from '@/src/common/ProductCard';

// The category-tag slugs surfaced as tabs on the landing's BestSellers
// section. The array is the single source of truth; the union type is
// derived so adding a third tab here updates both the iteration and the
// `category` state's allowed values automatically.
const FEATURED_CATEGORY_SLUGS = ['flowers', 'plants'] as const;
type FeaturedCategorySlug = (typeof FEATURED_CATEGORY_SLUGS)[number];

export const BestSellers = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [category, setCategory] = useState<FeaturedCategorySlug>('flowers');

  const { data: productData } = useQuery({
    ...productQueries.list({ category: [category], size: 8 }),
    placeholderData: keepPreviousData,
  });

  return (
    <section className='pt-landing-section pb-landing-section pl-page flex w-full flex-col gap-6'>
      <header className='font-crimson text-landing-section-header font-medium'>
        Shop Our Best Sellers
      </header>

      <div className='pr-page'>
        <div className='border-foreground/40 flex gap-5 border-b'>
          {FEATURED_CATEGORY_SLUGS.map((item) => (
            <BestSellersHeaderItem
              key={item}
              item={item}
              selected={category}
              onClick={setCategory}
            />
          ))}
        </div>
      </div>

      <HorizontalList scrollRef={scrollRef} className='gap-2 lg:gap-4'>
        {productData?.data.map((product) => (
          <div key={product.id} className='w-carousel-card shrink-0'>
            <ProductCard product={product} compact />
          </div>
        ))}
      </HorizontalList>
    </section>
  );
};
