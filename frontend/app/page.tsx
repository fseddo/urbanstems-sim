import AboutUs from '@/components/landing/AboutUs';
import BestSellers from '@/components/landing/bestSellers/BestSellers';
import { LandingVideo } from '@/components/landing/video/LandingVideo';
import { OccasionCarousel } from '@/components/landing/occasionCarousel/OccasionCarousel';
import { Reviews } from '@/components/landing/reviews/Reviews';
import { useNavbar } from '@/contexts/NavbarContext';

export default function Home() {
  return (
    <div className='flex w-full flex-col gap-12'>
      <LandingVideo />
      <OccasionCarousel />
      <Reviews />
      <AboutUs />
      <BestSellers />
    </div>
  );
}
