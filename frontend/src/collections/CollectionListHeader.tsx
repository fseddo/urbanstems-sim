import type { ColumnCount } from '@/src/common/List';
import { useIsDesktop } from '@/src/common/useIsDesktop';
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

// The bar above the product grid: Filter & Sort, delivery date, sending-to,
// column-count chooser. Layout differs between viewports — on desktop all
// four cells share one row; on mobile the date and address stack on top with
// Filter & Sort and the chooser sharing the bottom row.

export const CollectionListHeader = ({
  onOpenFilters,
  activeFilterCount,
  columnCount,
  onColumnCountChange,
}: Props) => {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <header className='flex border-y text-sm'>
        <FilterCell
          count={activeFilterCount}
          onOpen={onOpenFilters}
          className='px-navbar cursor-pointer gap-3'
        />
        <DateCell />
        <AddressCell />
        <ColumnChooserCell
          value={columnCount}
          onChange={onColumnCountChange}
          className='px-listing-cell lg:border-r-0'
        />
      </header>
    );
  }

  return (
    <header className='flex flex-col border-t text-sm'>
      <DateCell />
      <AddressCell />
      <div className='flex'>
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
