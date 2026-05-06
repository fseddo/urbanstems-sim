import { useParams } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { productQueries } from '@/api/products/productQueries';
import { ProductBottomBar } from './ProductBottomBar';
import { ProductBackgroundImages } from './ProductBackgroundImages';
import { ProductHeader } from './ProductHeader';
import { ProductDetailPane } from './productDetailPane/ProductDetailPane';
import { ProductImageGrid } from './ProductImageGrid';
import { ProductInfoAccordion } from './ProductInfoAccordion';
import { ProductReviews } from './ProductReviews';
import { ProductDeliveryInstructions } from './ProductDeliveryInstructions';
import { ProductRecommendations } from './ProductRecommendations';

export const ProductDetailPage = () => {
  const { slug } = useParams({ from: '/products/$slug' });
  const { data: product } = useSuspenseQuery(productQueries.detail(slug));
  const addToCartRef = useRef<HTMLButtonElement>(null);

  return (
    <div>
      <section className='relative'>
        <div
          className='relative p-8 py-4'
          style={{ height: 'calc(100dvh - var(--navbar-height))' }}
        >
          <ProductBackgroundImages product={product} />
          <ProductHeader product={product} />
        </div>
        <div className='ml-20 flex w-[50%] flex-col gap-5 pt-20 pr-4'>
          <ProductDetailPane product={product} addToCartRef={addToCartRef} />
          {product.main_detail_src && <ProductImageGrid product={product} />}
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

      <ProductReviews product={product} />
      <ProductRecommendations />
      <ProductDeliveryInstructions />
      <ProductBottomBar product={product} addToCartRef={addToCartRef} />
    </div>
  );
};
