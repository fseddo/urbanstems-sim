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
import { DatePicker } from '@/src/date/DatePicker';
import { deliveryDateAtom } from '@/src/date/deliveryDateAtom';
import { ColumnChooser } from './ColumnChooser';
import { ListingHeaderBarItem } from './ListingHeaderBarItem';

type Props = {
  onOpenFilters: () => void;
  columnCount: ColumnCount;
  onColumnCountChange: (next: ColumnCount) => void;
};

// The bar above the product grid: Filter & Sort, delivery date, sending-to,
// column-count chooser. Layout differs between viewports — on desktop all
// four cells share one row; on mobile the date and address stack on top with
// Filter & Sort and the chooser sharing the bottom row.

export const ListingHeaderBar = ({
  onOpenFilters,
  columnCount,
  onColumnCountChange,
}: Props) => {
  const [deliveryDate, setDeliveryDate] = useAtom(deliveryDateAtom);
  const [deliveryAddress, setDeliveryAddress] = useAtom(deliveryAddressAtom);
  const isDesktop = useIsDesktop();

  // Date and Sending-to render the same in both layouts — extracted so the
  // branches below stay focused on the parts that differ (Filter & Sort and
  // the chooser, which swap between top-level cells on desktop and a shared
  // sub-row on mobile).
  const dateCell = (
    <DatePicker
      className='flex flex-1'
      value={deliveryDate}
      onChange={setDeliveryDate}
      trigger={({ toggle, formatted }) => (
        <ListingHeaderBarItem
          Icon={CalendarIcon}
          className='flex-1 cursor-pointer'
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
      className='flex flex-3'
      value={deliveryAddress}
      onChange={setDeliveryAddress}
      trigger={({ toggle, value, formatted }) => (
        <ListingHeaderBarItem
          Icon={SlLocationPin}
          className='flex-3 cursor-pointer'
          onClick={toggle}
        >
          <div>
            Sending to:{' '}
            <span className='font-normal'>
              {value ? formatted : DEFAULT_DELIVERY_LOCATION}
            </span>
          </div>
        </ListingHeaderBarItem>
      )}
    />
  );

  if (isDesktop) {
    return (
      <header className='flex border-y'>
        <ListingHeaderBarItem
          Icon={FilterIcon}
          className='cursor-pointer'
          onClick={onOpenFilters}
        >
          Filter & Sort
        </ListingHeaderBarItem>
        {dateCell}
        {addressCell}
        <ListingHeaderBarItem className='lg:border-r-0'>
          <ColumnChooser value={columnCount} onChange={onColumnCountChange} />
        </ListingHeaderBarItem>
      </header>
    );
  }

  return (
    <header className='flex flex-col border-t'>
      {dateCell}
      {addressCell}
      <div className='flex'>
        <ListingHeaderBarItem
          Icon={FilterIcon}
          className='flex-1 cursor-pointer border-r'
          onClick={onOpenFilters}
        >
          Filter & Sort
        </ListingHeaderBarItem>
        <ListingHeaderBarItem>
          <ColumnChooser value={columnCount} onChange={onColumnCountChange} />
        </ListingHeaderBarItem>
      </div>
    </header>
  );
};
