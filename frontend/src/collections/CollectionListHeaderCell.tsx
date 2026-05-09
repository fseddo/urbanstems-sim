import { JSX, ReactNode } from 'react';
import { IconType } from 'react-icons';
import { tw } from '@/src/common/utils/tw';

// One cell in the listing header bar — icon + label, dividers between
// cells. Shared base for the per-cell components in `cells/`.

export const CollectionListHeaderCell = ({
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
        'h-listing-bar flex items-center gap-2 border-b px-4 py-2.5 font-bold lg:border-r lg:border-b-0',
        className
      )}
      onClick={onClick}
    >
      {Icon && <Icon />}
      {children}
    </div>
  );
};
