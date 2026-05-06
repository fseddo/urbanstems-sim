import { useRef } from 'react';
import { ReviewCard } from './ReviewCard';
import { LANDING_REVIEWS } from './constants';
import { HorizontalList } from '@/src/common/HorizontalList';

export const Reviews = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section className='flex w-full flex-col gap-14 pl-page'>
      <header className='font-crimson text-[52px] font-medium'>
        More than 20,000 Five-Star Reviews
      </header>

      <HorizontalList scrollRef={scrollRef}>
        {LANDING_REVIEWS?.map((review, idx) => (
          <ReviewCard key={idx} {...review} />
        ))}
      </HorizontalList>
    </section>
  );
};
