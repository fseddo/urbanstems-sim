import { createFileRoute, redirect } from '@tanstack/react-router';
import { productQueries } from '@/api/products/queries';
import { imageAtWidth } from '@/src/common/utils/imageAtWidth';
import { prefetchImages } from '@/src/common/utils/prefetchImages';
import { ProductDetailPage } from '@/src/products/ProductDetailPage';

export const Route = createFileRoute('/products/$slug')({
  loader: async ({ params, context }) => {
    try {
      const product = await context.queryClient.ensureQueryData(
        productQueries.detail(params.slug)
      );

      const titleName = product.name
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      document.title = `${titleName} | UrbanStems Flower Delivery`;

      const imageUrls = [product.main_image, product.hover_image]
        .filter((url): url is string => url != null)
        .map((url) => imageAtWidth(url, 1600));

      await prefetchImages(imageUrls);
    } catch {
      throw redirect({ to: '/collections/$slug', params: { slug: 'all' } });
    }
  },
  component: ProductDetailPage,
});
