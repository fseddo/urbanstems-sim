import FlowersCarousel from './landing/FlowerCarousel';
import { LandingVideo } from './landing/LandingVideo';
import { RefObject } from 'react';
import { Occasion, Product } from '@/types/api';
import ReviewImages from './landing/ReviewImages';
import AboutUs from './landing/AboutUs';
import BestSellers from './landing/BestSellers';

interface HomeContentProps {
  navbarRef: RefObject<HTMLElement | null>;
  occasions: Occasion[];
  flowers: Product[];
  plants: Product[];
}

export const HomeContent = ({
  navbarRef,
  occasions,
  flowers,
  plants,
}: HomeContentProps) => {
  return (
    <div className='flex w-full flex-col gap-12'>
      <LandingVideo navbarRef={navbarRef} />
      <FlowersCarousel occasions={occasions} />
      <ReviewImages occasions={occasions} />
      <AboutUs />
      <BestSellers flowers={flowers} plants={plants} />
    </div>
  );
};
