import FlowersCarousel from './landing/FlowerCarousel';
import { LandingVideo } from './landing/LandingVideo';
import { RefObject } from 'react';
import { Occasion } from '@/types/api';
import ReviewImages from './landing/ReviewImages';

interface HomeContentProps {
  navbarRef: RefObject<HTMLElement | null>;
  occasions: Occasion[];
}

export const HomeContent = ({ navbarRef, occasions }: HomeContentProps) => {
  return (
    <div className='flex w-full flex-col gap-12'>
      <LandingVideo navbarRef={navbarRef} />
      <FlowersCarousel occasions={occasions} />
      <ReviewImages occasions={occasions} />
    </div>
  );
};
