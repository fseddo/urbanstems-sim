import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tagQueries } from '@/api/tags/tagQueries';
import { OccasionCard } from './OccasionCard';
import { HorizontalList } from '@/src/common/HorizontalList';

export const OccasionCarousel = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: occasions } = useQuery(tagQueries.list('occasion'));

  return (
    <section className='pt-landing-section pb-landing-section pl-page flex w-full flex-col gap-6'>
      <header className='font-crimson text-landing-section-header font-medium'>
        Flowers & Gifts For Every Occasion
      </header>
      <HorizontalList
        scrollRef={scrollRef}
        className='gap-2 min-[1020px]:gap-4'
      >
        {occasions?.flatMap(
          (occasion) =>
            occasion.image_src && (
              <OccasionCard key={occasion.id} occasion={occasion} />
            )
        )}
      </HorizontalList>
    </section>
  );
};
