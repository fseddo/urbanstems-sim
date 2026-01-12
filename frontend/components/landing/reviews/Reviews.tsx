'use client';

import { useRef } from 'react';
import { occasionsQueries } from '@/lib/occasions/queries';
import { useQuery } from '@tanstack/react-query';
import { HorizontalList } from '../../HorizontalList';
import { ReviewCard } from './ReviewCard';

export const Reviews = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: occasions } = useQuery({ ...occasionsQueries });
  //TODO: remove the need to filter this
  const carouselOccasions = occasions?.results.filter(
    (occasion) => occasion.image_src
  );

  //TODO: pull from review data instead of occasion data
  const imgSrc1 = carouselOccasions?.[0].image_src as string;
  const imgSrc2 = carouselOccasions?.[1].image_src as string;
  const imgSrc3 = carouselOccasions?.[2].image_src as string;

  return (
    <section className='flex w-full flex-col gap-14 pl-20'>
      <header className='font-crimson text-[52px] font-medium'>
        More than 20,000 Five-Star Reviews
      </header>

      <HorizontalList scrollRef={scrollRef}>
        {carouselOccasions?.map((occasion, idx) => (
          <ReviewCard
            key={occasion.id}
            occasion={occasion}
            imgSrc1={imgSrc1}
            imgSrc2={imgSrc2}
            imgSrc3={imgSrc3}
          />
        ))}
      </HorizontalList>
    </section>
  );
};
