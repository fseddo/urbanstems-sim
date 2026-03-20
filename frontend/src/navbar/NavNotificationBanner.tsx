import { Link } from '@tanstack/react-router';

export const NavNotificationBanner = () => {
  return (
    <div className='bg-brand-primary font-crimson w-full justify-center pt-1.5 pb-[7px] text-center text-base text-white/90'>
      <div className='mt-[3px]'>
        Spring Has Arrived! Explore Fresh Seasonal Blooms For Every Occasion.{' '}
        <Link
          to='/collections/$slug'
          params={{ slug: 'new-the-spring-collection' }}
        >
          <span className='underline'>Shop Now</span>
        </Link>
      </div>
    </div>
  );
};
