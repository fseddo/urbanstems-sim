import { createFileRoute } from '@tanstack/react-router';
import { AboutUs } from '@/src/landing/AboutUs';
import { BestSellers } from '@/src/landing/bestSellers/BestSellers';
import { LandingVideo } from '@/src/landing/video/LandingVideo';
import { OccasionCarousel } from '@/src/landing/occasionCarousel/OccasionCarousel';
import { Reviews } from '@/src/landing/reviews/Reviews';

export const Route = createFileRoute('/')({
  component: Home,
  loader: () => {
    document.title = 'UrbanStems | Online Flower Delivery';
  },
});

function Home() {
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
