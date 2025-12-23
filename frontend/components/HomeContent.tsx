import { LandingVideo } from './landing/LandingVideo';
import { RefObject } from 'react';
import ReviewImages from './landing/ReviewImages';
import AboutUs from './landing/AboutUs';
import FlowerCarousel from './landing/FlowerCarousel';
import BestSellers from './landing/BestSellers';

interface HomeContentProps {
  navbarRef: RefObject<HTMLElement | null>;
}

export default ({ navbarRef }: HomeContentProps) => {
  return (
    <div className='flex w-full flex-col gap-12'>
      <LandingVideo navbarRef={navbarRef} />
      <FlowerCarousel />
      <ReviewImages />
      <AboutUs />
      <BestSellers />
    </div>
  );
};
