'use client';

import { Occasion } from '@/types/api';
import { useRef } from 'react';
import HorizontalScrollbar from '../HorizontalScrollbar';
import { capitalizeString } from '@/utils/capitalizeString';

interface FlowersCarouselProps {
  occasions: Occasion[];
}

export default ({ occasions }: FlowersCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const carouselOccasions = occasions.filter((occasion) => occasion.image_src);
  return (
    <section className='flex w-full flex-col gap-6 pl-20'>
      <header className='font-crimson text-[52px] font-medium'>
        Flowers & Gifts For Every Occasion
      </header>
      <div className='flex w-full flex-col gap-14'>
        <div
          className='hide-scrollbar flex gap-6 overflow-x-auto overflow-y-hidden pr-20'
          ref={scrollRef}
        >
          {carouselOccasions.map((occasion) => (
            <OccasionCard key={occasion.id} occasion={occasion} />
          ))}
        </div>
        <HorizontalScrollbar targetRef={scrollRef} />
      </div>
    </section>
  );
};

const OccasionCard = ({ occasion }: { occasion: Occasion }) => {
  return (
    <div className='flex flex-shrink-0 flex-col gap-6'>
      <img className='w-[330px] rounded-lg' src={occasion.image_src} />
      <div className='font-crimson flex items-center justify-center text-3xl'>
        {capitalizeString(occasion.name)}
      </div>
    </div>
  );
};
