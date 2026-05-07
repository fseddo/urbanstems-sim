import { capitalizeString } from '@/src/common/utils/capitalizeString';
import type { Tag } from '@/api/tags/Tag';
import { Link } from '@tanstack/react-router';
import { tw } from '@/src/common/utils/tw';

export const OccasionCard = ({ occasion }: { occasion: Tag }) => {
  return (
    <Link
      to='/collections/$slug'
      params={{ slug: occasion.slug }}
      className='flex flex-shrink-0 flex-col gap-6'
    >
      <div className='w-occasion-card overflow-hidden rounded-lg'>
        <img
          className='w-full transition-transform duration-300 hover:scale-105'
          src={occasion.image_src ?? undefined}
        />
      </div>
      <div
        className={tw(
          'font-crimson flex items-center justify-center',
          'text-[15px] min-[1020px]:text-[24px]'
        )}
      >
        {capitalizeString(occasion.name)}
      </div>
    </Link>
  );
};
