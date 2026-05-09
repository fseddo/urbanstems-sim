import { Link } from '@tanstack/react-router';
import { capitalizeString } from '../utils/capitalizeString';
import { tw } from '../utils/tw';

type Props = {
  includeShopAll?: boolean;
  currentPageTitle?: string;
  // Wraps the row in a translucent backdrop pill (bg + padding +
  // rounded corners). Used on the PDP where the breadcrumbs sit over
  // the hero image and need a backdrop for legibility.
  withBackdrop?: boolean;
  className?: string;
};

export const NavigationBreadcrumbs = ({
  includeShopAll,
  currentPageTitle,
  withBackdrop,
  className,
}: Props) => {
  return (
    <header
      className={tw(
        'relative z-10 flex w-fit gap-3 text-xs',
        withBackdrop && 'bg-background/80 gap-5 rounded-sm px-4 py-1.5',
        className
      )}
    >
      <Link to='/'>
        <div className='underline'>Home</div>
      </Link>
      {includeShopAll && (
        <Link to='/collections/$slug' params={{ slug: 'all' }}>
          <div className='underline'>Shop All</div>
        </Link>
      )}
      {currentPageTitle && (
        <div className='opacity-80'>{capitalizeString(currentPageTitle)}</div>
      )}
    </header>
  );
};
