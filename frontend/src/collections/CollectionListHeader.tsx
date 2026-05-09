import { useEffect, useRef, useState } from 'react';
import type { ColumnCount } from '@/src/common/List';
import { useIsDesktop } from '@/src/common/useIsDesktop';
import { tw } from '@/src/common/utils/tw';
import { AddressCell } from './cells/AddressCell';
import { ColumnChooserCell } from './cells/ColumnChooserCell';
import { DateCell } from './cells/DateCell';
import { FilterCell } from './cells/FilterCell';

type Props = {
  onOpenFilters: () => void;
  activeFilterCount: number;
  columnCount: ColumnCount;
  onColumnCountChange: (next: ColumnCount) => void;
};

// The bar above the product grid. Sticks to the top of the viewport once
// scrolled past, but only the Filter & Sort + Column chooser portion stays
// visible while stuck — Date and Address scroll away with the rest of the
// page. Mobile achieves this structurally (Date/Address are non-sticky rows
// above a sticky Filter+Chooser sub-row); desktop keeps a single 4-cell row
// at rest and detects the stuck state via an IntersectionObserver on a
// sentinel just above the bar, hiding Date/Address while stuck.

export const CollectionListHeader = ({
  onOpenFilters,
  activeFilterCount,
  columnCount,
  onColumnCountChange,
}: Props) => {
  const isDesktop = useIsDesktop();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isStuck, setIsStuck] = useState(false);

  useEffect(() => {
    if (!isDesktop) {
      setIsStuck(false);
      return;
    }
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsStuck(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isDesktop]);

  if (isDesktop) {
    return (
      <>
        <div ref={sentinelRef} aria-hidden className='h-px' />
        <header className='bg-background sticky top-0 z-40 flex border-y text-sm'>
          <FilterCell
            count={activeFilterCount}
            onOpen={onOpenFilters}
            className='px-navbar cursor-pointer gap-3'
          />
          <DateCell
            className={tw(
              'transition-opacity duration-200',
              isStuck && 'pointer-events-none opacity-0'
            )}
          />
          <AddressCell
            className={tw(
              'transition-opacity duration-200',
              isStuck && 'pointer-events-none opacity-0'
            )}
          />
          <ColumnChooserCell
            value={columnCount}
            onChange={onColumnCountChange}
            className='px-listing-cell lg:border-r-0'
          />
        </header>
      </>
    );
  }

  return (
    <header className='flex flex-col border-t text-sm'>
      <DateCell />
      <AddressCell />
      <div className='bg-background sticky top-0 z-40 flex'>
        <FilterCell
          count={activeFilterCount}
          onOpen={onOpenFilters}
          className='flex-1 cursor-pointer border-r'
        />
        <ColumnChooserCell value={columnCount} onChange={onColumnCountChange} />
      </div>
    </header>
  );
};
