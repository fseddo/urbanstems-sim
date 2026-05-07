import { useRef } from 'react';
import { ReviewCard } from './ReviewCard';
import { LANDING_REVIEWS } from './constants';
import { HorizontalList } from '@/src/common/HorizontalList';

export const Reviews = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section className='pt-landing-section pb-landing-section pl-page flex w-full flex-col gap-14'>
      <header className='font-crimson text-landing-section-header font-medium'>
        More than 20,000 Five-Star Reviews
      </header>

      <HorizontalList scrollRef={scrollRef}>
        {LANDING_REVIEWS.map((review) => (
          <ReviewCard key={review.id} {...review} />
        ))}
      </HorizontalList>
    </section>
  );
};
