import FlowersCarousel from './landing/FlowerCarousel';
import { LandingVideo } from './landing/LandingVideo';
import { RefObject } from 'react';
import { Occasion } from '@/types/api';

interface HomeContentProps {
  navbarRef: RefObject<HTMLElement | null>;
  occasions: Occasion[];
}

export const HomeContent = ({ navbarRef, occasions }: HomeContentProps) => {
  return (
    <div className='flex w-full flex-col gap-16'>
      <LandingVideo navbarRef={navbarRef} />
      <FlowersCarousel occasions={occasions} />
    </div>
  );
};
