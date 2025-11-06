import { Occasion } from '@/types/api';

interface FlowersCarouselProps {
  occasions: Occasion[];
}

export default ({ occasions }: FlowersCarouselProps) => {
  const carouselOccasions = occasions.filter((occasion) => occasion.image_src);
  return (
    <section className='flex w-full flex-col'>
      <header className='font-crimson pl-20 text-5xl font-medium'>
        Flowers & Gifts For Every Occasion
      </header>
      <div className='flex gap-4'>
        {carouselOccasions.map((occasion) => (
          <OccasionCard key={occasion.id} occasion={occasion} />
        ))}
      </div>
    </section>
  );
};

const OccasionCard = ({ occasion }: { occasion: Occasion }) => {
  return <div>{occasion.name}</div>;
};
