import { Link } from '@tanstack/react-router';
import { tw } from '../common/utils/tw';

export const NavNotificationBanner = () => {
  return (
    <div
      className={tw(
        'bg-brand-summer font-crimson text-center text-white',
        'px-navbar w-full py-1.5',
        'text-[16px] max-[560px]:text-[14px] max-[560px]:leading-3'
      )}
    >
      Spring Has Arrived! Explore Fresh Seasonal Blooms For Every Occasion.{' '}
      <Link
        to='/collections/$slug'
        params={{ slug: 'new-the-spring-collection' }}
        className='whitespace-nowrap underline'
      >
        Shop Now
      </Link>
    </div>
  );
};
