'use client';

import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { occasionQueries } from '@/lib/occasions/queries';
import { HorizontalList } from '../../HorizontalList';
import { OccasionCard } from './OccasionCard';

export const OccasionCarousel = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: occasions } = useQuery(occasionQueries.list());

  return (
    <section className='flex w-full flex-col gap-6 pl-20'>
      <header className='font-crimson text-[52px] font-medium'>
        Flowers & Gifts For Every Occasion
      </header>
      <HorizontalList scrollRef={scrollRef}>
        {occasions?.data?.flatMap(
          (occasion) =>
            occasion.image_src && (
              <OccasionCard key={occasion.id} occasion={occasion} />
            )
        )}
      </HorizontalList>
    </section>
  );
};
