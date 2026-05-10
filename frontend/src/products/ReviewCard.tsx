import { useState } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import { tw } from '@/src/common/utils/tw';
import { StarRating } from '@/src/common/components/StarRating';
import { DisplayReview } from './reviewAtoms';

const FADE_DURATION_MS = 200;

type Props = {
  review: DisplayReview;
  onDelete?: () => void;
};

export const ReviewCard = ({ review, onDelete }: Props) => {
  const verified = review.is_verified_buyer;
  // Local fade-out: flip `deleting` immediately so the opacity transition
  // plays, then defer the parent's atom removal until the fade completes.
  const [deleting, setDeleting] = useState(false);
  const handleDelete = () => {
    if (deleting || !onDelete) return;
    setDeleting(true);
    setTimeout(onDelete, FADE_DURATION_MS);
  };
  return (
    <div
      className={tw(
        'font-mulish animate-fade-in relative flex flex-col gap-1 px-10 py-10 transition-opacity duration-200',
        verified ? 'bg-white' : 'bg-error/10',
        deleting && 'pointer-events-none opacity-0'
      )}
    >
      {onDelete && (
        <button
          type='button'
          onClick={handleDelete}
          aria-label='Delete review'
          className='text-foreground/40 hover:text-foreground/80 absolute top-5 right-5 transition-colors'
        >
          <FiTrash2 size={18} />
        </button>
      )}

      {/* Left panel - Reviewer info */}
      <div className='flex items-baseline gap-3 text-xs'>
        <span>{review.reviewer_name}</span>
        <span className='text-foreground/70'>
          {verified ? 'Verified Buyer' : 'Pending Review'}
        </span>
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
