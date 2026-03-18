import { StarRating } from '@/src/common/StarRating';
import { Review } from '@/api/reviews/Review';

export const ReviewCard = ({ review }: { review: Review }) => {
  return (
    <div className='font-mulish flex flex-col gap-1 bg-white px-10 py-10'>
      {/* Left panel - Reviewer info */}
      <div className='flex items-baseline gap-3 text-xs'>
        <span>{review.reviewer_name}</span>
        {review.is_verified_buyer && (
          <span className='text-foreground/70'>Verified Buyer</span>
        )}
      </div>

      {/* Center panel - Rating, title, body */}
      <div className='flex flex-col gap-2 pb-4'>
        {review.title && (
          <span className='font-crimson text-2xl'>{review.title}</span>
        )}
        <StarRating rating={review.rating} size={15} />
        {review.body && (
          <p className='text-brand-primary font-crimson text-xl leading-relaxed italic'>
            {review.body}
          </p>
        )}
      </div>

      <div className='border-background-alt/80 flex border-t pt-4 text-sm'>
        <span className='text-brand-primary/60 text-xs'>{review.date}</span>
      </div>
    </div>
  );
};
