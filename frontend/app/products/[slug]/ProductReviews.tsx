import { StarRating } from '@/components/StarRating';
import { Product } from '@/types/api';

export const ProductReviews = ({ product }: { product: Product }) => {
  return (
    <div className='bg-background-alt/30 flex flex-col items-center gap-6 py-20'>
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
    </div>
  );
};
