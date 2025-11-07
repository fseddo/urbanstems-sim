'use client';

import { Occasion } from '@/types/api';
import { useRef } from 'react';
import HorizontalScrollbar from '../HorizontalScrollbar';

interface ReviewImagesProps {
  occasions: Occasion[];
}

export default ({ occasions }: ReviewImagesProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const carouselOccasions = occasions.filter((occasion) => occasion.image_src);
  const imgSrc1 = carouselOccasions[0].image_src as string;
  const imgSrc2 = carouselOccasions[1].image_src as string;
  const imgSrc3 = carouselOccasions[2].image_src as string;

  return (
    <section className='flex w-full flex-col gap-14 pl-20'>
      <header className='font-crimson text-[52px] font-medium'>
        More than 20,000 Five-Star Reviews
      </header>
      <div className='flex w-full flex-col gap-14'>
        <div
          className='hide-scrollbar flex gap-6 overflow-x-auto overflow-y-hidden pr-20'
          ref={scrollRef}
        >
          {carouselOccasions.map((occasion, idx) => (
            <ReviewCard
              key={occasion.id}
              occasion={occasion}
              imgSrc1={imgSrc1}
              imgSrc2={imgSrc2}
              imgSrc3={imgSrc3}
            />
          ))}
        </div>
        <HorizontalScrollbar targetRef={scrollRef} />
      </div>
    </section>
  );
};

const ReviewCard = ({
  occasion,
  imgSrc1,
  imgSrc2,
  imgSrc3,
}: {
  occasion: Occasion;
  imgSrc1: string;
  imgSrc2: string;
  imgSrc3: string;
}) => {
  const imgSrc = occasion.image_src;
  return (
    <div className='flex flex-shrink-0 flex-col'>
      <div className='group relative h-[400px] w-[450px]'>
        {/* Front image - upright */}
        <img
          className='absolute top-10 left-28 z-30 h-[340px] w-[230px] rounded-lg object-cover shadow-lg transition-all duration-800 group-hover:top-5'
          src={imgSrc1}
        />

        {/* Middle image - tilted behind */}
        <img
          className='absolute top-6 left-18 z-20 h-[340px] w-[230px] rounded-lg object-cover shadow-lg transition-all duration-800 group-hover:top-10 group-hover:left-8'
          src={imgSrc2}
          style={{ transform: 'rotate(-10deg)' }}
        />

        {/* Back image - tilted behind */}
        <img
          className='absolute top-6 left-38 z-10 h-[340px] w-[230px] rounded-lg object-cover shadow-lg transition-all duration-800 group-hover:top-10 group-hover:left-48'
          src={imgSrc3}
          style={{ transform: 'rotate(10deg)' }}
        />
      </div>

      <div className='font-crimson flex items-center justify-center text-3xl'>
        Janna
      </div>
    </div>
  );
};
