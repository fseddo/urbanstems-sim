import { createFileRoute } from '@tanstack/react-router';
import { useNavbar } from '@/src/navbar/NavbarContext';
import { useElementHeight } from '@/src/navbar/useElementHeight';
import { productQueries } from '@/api/products/queries';
import { useQuery } from '@tanstack/react-query';
import { ProductBackgroundImages } from '@/src/products/ProductBackgroundImages';
import { ProductHeader } from '@/src/products/ProductHeader';
import { ProductDetailPane } from '@/src/products/productDetailPane/ProductDetailPane';
import { ProductImageGrid } from '@/src/products/ProductImageGrid';
import { ProductInfoAccordion } from '@/src/products/ProductInfoAccordion';
import { ProductReviews } from '@/src/products/ProductReviews';
import { ProductDeliveryInstructions } from '@/src/products/ProductDeliveryInstructions';
import { ProductRecommendations } from '@/src/products/ProductRecommendations';

export const Route = createFileRoute('/products/$slug')({
  component: ProductDetail,
});

function ProductDetail() {
  const { slug } = Route.useParams();
  const {
    data: product,
    isLoading,
    isError,
    error,
  } = useQuery(productQueries.detail(slug));

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
    </div>
  );
}
