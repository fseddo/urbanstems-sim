import { useQuery } from '@tanstack/react-query';
import { StarRating } from '@/src/common/components/StarRating';
import { Product } from '@/api/products/Product';
import { reviewQueries } from '@/api/reviews/reviewQueries';
import { ReviewCard } from './ReviewCard';

export const ProductReviews = ({ product }: { product: Product }) => {
  const { data: reviewsData } = useQuery(
    reviewQueries.list({ product_slug: product.slug })
  );

  const reviews = reviewsData?.data ?? [];

  return (
    <div id='reviews' className='bg-background-alt/30 flex flex-col items-center gap-10 py-20'>
      <div className='font-crimson flex flex-col items-center gap-2 text-5xl'>
        {`${product.name} Reviews`}{' '}
        <div className='font-mulish flex items-center gap-2'>
          <StarRating rating={product.reviews_rating} size={20} />
          {product.reviews_count && (
            <span className='text-brand-primary text-base'>
              {product.reviews_count} Reviews
            </span>
          )}
        </div>
      </div>

      <button className='bg-brand-primary rounded-sm p-4 px-8 text-sm tracking-wider text-white'>
        WRITE A REVIEW
      </button>

      {/* TODO: gutter is `px-page` for now to avoid horizontal overflow at
          narrow viewports. The design has a page-aligned gutter at desktop
          (matches `<ProductRecommendations>`) and a wider-than-page gutter
          at mobile — when revisiting, introduce a dedicated token rather
          than reusing `px-page`. See `docs/frontend/features/products.md`. */}
      {reviews.length > 0 && (
        <div className='flex w-full flex-col gap-6 px-page'>
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
};
