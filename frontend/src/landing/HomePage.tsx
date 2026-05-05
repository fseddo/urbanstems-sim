import { AboutUs } from './AboutUs';
import { BestSellers } from './bestSellers/BestSellers';
import { LandingVideo } from './video/LandingVideo';
import { OccasionCarousel } from './occasionCarousel/OccasionCarousel';
import { Reviews } from './reviews/Reviews';

export const HomePage = () => {
  return (
    <div className='flex w-full flex-col gap-12'>
      <LandingVideo />
      <OccasionCarousel />
      <Reviews />
      <AboutUs />
      <BestSellers />
    </div>
  );
};
