import { useAtom } from 'jotai';
import { SlLocationPin } from 'react-icons/sl';
import { AddressPicker } from '@/src/address/AddressPicker';
import {
  DEFAULT_DELIVERY_LOCATION,
  deliveryAddressAtom,
} from '@/src/address/deliveryAddressAtom';
import { CalendarIcon } from '@/src/common/icons/CalendarIcon';
import { FilterIcon } from '@/src/common/icons/FilterIcon';
import type { ColumnCount } from '@/src/common/List';
import { useIsDesktop } from '@/src/common/useIsDesktop';
import { tw } from '@/src/common/utils/tw';
import { DatePicker } from '@/src/date/DatePicker';
import { deliveryDateAtom } from '@/src/date/deliveryDateAtom';
import { ColumnChooser } from './ColumnChooser';
import { ListingHeaderBarItem } from './ListingHeaderBarItem';

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

export const ListingHeaderBar = ({
  onOpenFilters,
  activeFilterCount,
  columnCount,
  onColumnCountChange,
}: Props) => {
  const [deliveryDate, setDeliveryDate] = useAtom(deliveryDateAtom);
  const [deliveryAddress, setDeliveryAddress] = useAtom(deliveryAddressAtom);
  const isDesktop = useIsDesktop();

  const filterBubble =
    activeFilterCount > 0 ? (
      <div className='bg-background-alt/80 flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium'>
        {activeFilterCount}
      </div>
    ) : (
      <div className='h-8 w-8' />
    );

  // Date and Sending-to render the same in both layouts — extracted so the
  // branches below stay focused on the parts that differ (Filter & Sort and
  // the chooser, which swap between top-level cells on desktop and a shared
  // sub-row on mobile).
  const dateCell = (
    <DatePicker
      className={tw('flex', 'h-listing-bar')}
      value={deliveryDate}
      onChange={setDeliveryDate}
      trigger={({ toggle, formatted }) => (
        <ListingHeaderBarItem
          Icon={CalendarIcon}
          className={tw(
            'flex-1 cursor-pointer',
            'lg:px-listing-cell lg:w-[270px] 2xl:w-[360px]'
          )}
          onClick={toggle}
        >
          <div>
            Delivery date: <span className='font-normal'>{formatted}</span>
          </div>
        </ListingHeaderBarItem>
      )}
    />
  );

  const addressCell = (
    <AddressPicker
      className={tw('flex flex-3', '')}
      value={deliveryAddress}
      onChange={setDeliveryAddress}
      resultRowClassName='lg:px-listing-cell'
      trigger={({ inputProps, label, value }) => (
        <ListingHeaderBarItem
          Icon={SlLocationPin}
          className={tw(
            'flex-3 cursor-text',
            'h-listing-bar lg:px-listing-cell'
          )}
          onClick={() => inputProps.ref.current?.focus()}
        >
          <div className='flex w-full min-w-0 items-baseline gap-1 overflow-hidden'>
            <span className='whitespace-nowrap'>{label}: </span>
            <input
              {...inputProps}
              placeholder={
                value ? inputProps.placeholder : DEFAULT_DELIVERY_LOCATION
              }
              className={tw(
                'min-w-0 flex-1 bg-transparent font-normal outline-none',
                'placeholder:text-foreground placeholder:opacity-100',
                'placeholder:transition-colors placeholder:duration-100 focus:placeholder:text-transparent'
              )}
            />
          </div>
        </ListingHeaderBarItem>
      )}
    />
  );

  if (isDesktop) {
    return (
      <header className='h-listing-bar flex border-y text-sm'>
        <ListingHeaderBarItem
          Icon={FilterIcon}
          className='px-navbar cursor-pointer gap-3'
          onClick={onOpenFilters}
        >
          Filter & Sort
          {filterBubble}
        </ListingHeaderBarItem>
        {dateCell}
        {addressCell}
        <ListingHeaderBarItem className='px-listing-cell lg:border-r-0'>
          <ColumnChooser value={columnCount} onChange={onColumnCountChange} />
        </ListingHeaderBarItem>
      </header>
    );
  }

  return (
    <header className='flex flex-col border-t text-sm'>
      {dateCell}
      {addressCell}
      <div className='h-listing-bar flex'>
        <ListingHeaderBarItem
          Icon={FilterIcon}
          className='flex-1 cursor-pointer border-r'
          onClick={onOpenFilters}
        >
          Filter & Sort
          {filterBubble}
        </ListingHeaderBarItem>
        <ListingHeaderBarItem>
          <ColumnChooser value={columnCount} onChange={onColumnCountChange} />
        </ListingHeaderBarItem>
      </div>
    </header>
  );
};
