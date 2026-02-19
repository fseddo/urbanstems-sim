'use client';

import { useNavbar } from '@/contexts/NavbarContext';
import { useElementHeight } from '@/hooks/useElementHeight';
import { productQueries } from '@/lib/products/queries';
import { useQuery } from '@tanstack/react-query';
import { use } from 'react';
import { ProductBackgroundImages } from './ProductBackgroundImages';
import { ProductHeader } from './ProductHeader';
import { ProductDetailPane } from './productDetailPane/ProductDetailPane';
import { ProductImageGrid } from './ProductImageGrid';
import { ProductInfoAccordion } from './ProductInfoAccordion';
import { ProductReviews } from './ProductReviews';
import { ProductDeliveryInstructions } from './ProductDeliveryInstructions';
import { ProductRecommendations } from './ProductRecommendations';

export default function ProductDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const {
    data: product,
    isLoading,
    isError,
    error,
  } = useQuery(productQueries.detail(resolvedParams.slug));

  const navbarRef = useNavbar();

  const navbarHeight = useElementHeight(navbarRef);
  const imageHeight =
    navbarHeight > 0 ? `calc(100vh - ${navbarHeight}px)` : '100vh';

  if (isLoading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='text-lg'>Loading product...</div>
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

  if (!product) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='text-lg'>Product not found</div>
      </div>
    );
  }

  return (
    <div>
      <section className='relative'>
        <div className='relative p-8 py-4' style={{ height: imageHeight }}>
          <ProductBackgroundImages product={product} />
          <ProductHeader product={product} />
        </div>
        <div className='ml-20 flex w-[50%] flex-col gap-5 pt-20 pr-4'>
          <ProductDetailPane product={product} navbarHeight={navbarHeight} />
          {/* Product detail images grid */}
          {product.main_detail_src && <ProductImageGrid product={product} />}
          {/* description and care instructions expandable menus */}
          <div className='flex flex-col pt-10 pb-20'>
            <ProductInfoAccordion
              label='Description'
              data={product.description}
            />
            <ProductInfoAccordion
              label='Care Instructions'
              data={product.care_instructions}
            />
          </div>
        </div>
      </section>

      {/* reviews */}
      <ProductReviews product={product} />
      {/* you may also like */}
      <ProductRecommendations product={product} />
      {/* how your package will arrive at your door */}
      <ProductDeliveryInstructions product={product} />
      {/* footer */}
    </div>
  );
}

//TODO: there is a bottom pane that should open on the product detail page when you scroll out of the pane view
