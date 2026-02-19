import { Occasion } from '@/types/api';
import { capitalizeString } from '@/utils/capitalizeString';
import { PrefetchLink } from '@/components/PrefetchLink';

export const OccasionCard = ({ occasion }: { occasion: Occasion }) => {
  return (
    <PrefetchLink
      href={`/collections/${occasion.slug}`}
      className='flex flex-shrink-0 flex-col gap-6'
    >
      <div className='w-[330px] overflow-hidden rounded-lg'>
        <img
          className='w-full transition-transform duration-300 hover:scale-105'
          src={occasion.image_src}
        />
      </div>
      <div className='font-crimson flex items-center justify-center text-3xl'>
        {capitalizeString(occasion.name)}
      </div>
    </PrefetchLink>
  );
};
