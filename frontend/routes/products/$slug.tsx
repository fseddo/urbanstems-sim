import { createFileRoute, redirect } from '@tanstack/react-router';
import { ApiError } from '@/api/request';
import { productQueries } from '@/api/products/productQueries';
import { capitalizeString } from '@/src/common/utils/capitalizeString';
import { imageAtWidth } from '@/src/common/utils/imageAtWidth';
import { prefetchImages } from '@/src/common/utils/prefetchImages';
import { ProductDetailPage } from '@/src/products/ProductDetailPage';

export const Route = createFileRoute('/products/$slug')({
  loader: async ({ params, context }) => {
    let product;
    try {
      product = await context.queryClient.ensureQueryData(
        productQueries.detail(params.slug)
      );
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        throw redirect({ to: '/collections/$slug', params: { slug: 'all' } });
      }
      throw e;
    }

    document.title = `${capitalizeString(product.name)} | UrbanStems Flower Delivery`;

    const imageUrls = [product.main_image, product.hover_image]
      .filter((url): url is string => url != null)
      .map((url) => imageAtWidth(url, 1600));

    await prefetchImages(imageUrls);
  },
  component: ProductDetailPage,
});
