import { JSX, ReactNode } from 'react';
import { IconType } from 'react-icons';
import { tw } from '@/src/common/utils/tw';

// One cell in the bar that sits above a product listing — icon + label,
// dividers between cells. Used by CollectionPage's filter / date / address
// row.

export const ListingHeaderBarItem = ({
  children,
  className,
  Icon,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  Icon?: IconType | (() => JSX.Element);
  onClick?: () => void;
}) => {
  return (
    <div
      className={tw(
        'flex items-center gap-3 border-b px-10 py-6 font-bold lg:border-r lg:border-b-0',
        className
      )}
      onClick={onClick}
    >
      {Icon && <Icon />}
      {children}
    </div>
  );
};
