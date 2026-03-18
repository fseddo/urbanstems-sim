import { useQuery } from '@tanstack/react-query';
import { StarRating } from '@/src/common/StarRating';
import { Product } from '@/api/products/Product';
import { reviewQueries } from '@/api/reviews/queries';
import { ReviewCard } from './ReviewCard';

export const ProductReviews = ({ product }: { product: Product }) => {
  const { data: reviewsData } = useQuery(
    reviewQueries.list({ product_slug: product.slug })
  );

  const reviews = reviewsData?.data ?? [];

  return (
    <div className='bg-background-alt/30 flex flex-col items-center gap-10 py-20'>
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

      {reviews.length > 0 && (
        <div className='flex w-full flex-col gap-6 px-50'>
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
};
