import { Link } from '@tanstack/react-router';
import { capitalizeString } from './utils/capitalizeString';
import { tw } from './utils/tw';

type Props = {
  shopAll?: boolean;
  leaf?: string;
  className?: string;
};

export const NavigationBreadcrumbs = ({ shopAll, leaf, className }: Props) => {
  return (
    <header
      className={tw(
        'bg-background/80 relative z-10 flex w-fit gap-5 rounded-sm px-4 py-1.5 text-xs',
        className
      )}
    >
      <Link to='/'>
        <div className='underline'>Home</div>
      </Link>
      {shopAll && (
        <Link to='/collections/$slug' params={{ slug: 'all' }}>
          <div className='underline'>Shop All</div>
        </Link>
      )}
      {leaf && <div className='opacity-80'>{capitalizeString(leaf)}</div>}
    </header>
  );
};
