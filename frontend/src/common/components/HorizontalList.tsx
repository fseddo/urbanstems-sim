import { ReactNode } from 'react';
import {
  HorizontalScrollbar,
  HorizontalScrollbarProps,
} from './HorizontalScrollbar';
import { tw } from '../utils/tw';

type HorizontalListProps = {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  children: ReactNode;
  // Inner scroller (the row that holds the cards). Controls gap *between* cards.
  className?: string;
  // Outer wrapper. Controls the gap *between* the scroller and the scrollbar.
  outerClassName?: string;
  // Pass-through to the scrollbar — width, height, thumb color.
  scrollbar?: Omit<HorizontalScrollbarProps, 'targetRef'>;
};

export const HorizontalList = ({
  scrollRef,
  children,
  className,
  outerClassName,
  scrollbar,
}: HorizontalListProps) => {
  return (
    <div className={tw('flex w-full flex-col gap-14', outerClassName)}>
      <div
        className={tw(
          'hide-scrollbar flex gap-6 overflow-x-auto overflow-y-hidden pr-page',
          className
        )}
        ref={scrollRef}
      >
        {children}
      </div>
      <HorizontalScrollbar targetRef={scrollRef} {...scrollbar} />
    </div>
  );
};
