import { capitalizeString } from '@/src/common/utils/capitalizeString';
import type { Tag } from '@/api/tags/Tag';
import { Link } from '@tanstack/react-router';

export const OccasionCard = ({ occasion }: { occasion: Tag }) => {
  return (
    <Link
      to='/collections/$slug'
      params={{ slug: occasion.slug }}
      className='flex flex-shrink-0 flex-col gap-6'
    >
      <div className='w-[330px] overflow-hidden rounded-lg'>
        <img
          className='w-full transition-transform duration-300 hover:scale-105'
          src={occasion.image_src ?? undefined}
        />
      </div>
      <div className='font-crimson flex items-center justify-center text-3xl'>
        {capitalizeString(occasion.name)}
      </div>
    </Link>
  );
};
