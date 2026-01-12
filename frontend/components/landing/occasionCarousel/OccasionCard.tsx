import { Occasion } from '@/types/api';
import { capitalizeString } from '@/utils/capitalizeString';

export const OccasionCard = ({ occasion }: { occasion: Occasion }) => {
  return (
    <div className='flex flex-shrink-0 flex-col gap-6'>
      <img className='w-[330px] rounded-lg' src={occasion.image_src} />
      <div className='font-crimson flex items-center justify-center text-3xl'>
        {capitalizeString(occasion.name)}
      </div>
    </div>
  );
};
