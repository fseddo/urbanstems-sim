import { createFileRoute, redirect } from '@tanstack/react-router';
import { productQueries } from '@/api/products/queries';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { ProductBottomBar } from '@/src/products/ProductBottomBar';
import { ProductBackgroundImages } from '@/src/products/ProductBackgroundImages';
import { ProductHeader } from '@/src/products/ProductHeader';
import { ProductDetailPane } from '@/src/products/productDetailPane/ProductDetailPane';
import { ProductImageGrid } from '@/src/products/ProductImageGrid';
import { ProductInfoAccordion } from '@/src/products/ProductInfoAccordion';
import { ProductReviews } from '@/src/products/ProductReviews';
import { ProductDeliveryInstructions } from '@/src/products/ProductDeliveryInstructions';
import { ProductRecommendations } from '@/src/products/ProductRecommendations';

export const Route = createFileRoute('/products/$slug')({
  loader: async ({ params, context }) => {
    try {
      await context.queryClient.ensureQueryData(
        productQueries.detail(params.slug)
      );
    } catch {
      throw redirect({ to: '/collections/$slug', params: { slug: 'all' } });
    }
  },
  component: ProductDetail,
});

function ProductDetail() {
  const { slug } = Route.useParams();
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
      <ProductRecommendations product={product} />
      <ProductDeliveryInstructions product={product} />
      <ProductBottomBar product={product} addToCartRef={addToCartRef} />
    </div>
  );
}
