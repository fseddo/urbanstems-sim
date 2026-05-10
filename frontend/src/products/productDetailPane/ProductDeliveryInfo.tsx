import { useEffect, useMemo, useState } from 'react';
import { useAtom } from 'jotai';
import { Product } from '@/api/products/Product';
import { AddressPicker } from '@/src/address/AddressPicker';
import { tw } from '@/src/common/utils/tw';
import {
  DatePicker,
  addDays,
  formatDeliveryDate,
  startOfDay,
} from '@/src/date/DatePicker';
import { deliveryDateAtom } from '@/src/date/deliveryDateAtom';
import {
  DEFAULT_DELIVERY_LOCATION,
  deliveryAddressAtom,
} from '@/src/address/deliveryAddressAtom';

export const DeliveryInformation = ({ product }: { product: Product }) => {
  const [deliveryDate, setDeliveryDate] = useAtom(deliveryDateAtom);
  const [deliveryAddress, setDeliveryAddress] = useAtom(deliveryAddressAtom);
  const [bumpedFrom, setBumpedFrom] = useState<Date | null>(null);

  const earliestDate = useMemo(
    () => startOfDay(addDays(new Date(), product.delivery_lead_time ?? 0)),
    [product.delivery_lead_time]
  );

  // If the order's delivery date falls before this product's earliest
  // available delivery, snap forward and remember the previous date so we
  // can tell the user it changed.
  useEffect(() => {
    if (startOfDay(deliveryDate) < earliestDate) {
      setBumpedFrom(deliveryDate);
      setDeliveryDate(earliestDate);
    }
  }, [deliveryDate, earliestDate, setDeliveryDate]);

  const handleChange = (date: Date) => {
    setBumpedFrom(null);
    setDeliveryDate(date);
  };

  return (
    <div className='flex w-full flex-col gap-2 pb-4'>
      <div className='font-bold'>Delivery Information</div>
      {bumpedFrom && (
        <div className='text-error text-xs'>
          This Product Is Not Available On The Date You Selected{' '}
          {formatDeliveryDate(bumpedFrom)}, We Updated The Date To The Closest
          Available Of {formatDeliveryDate(earliestDate)}.
        </div>
      )}
      <div className='border-background-alt flex rounded-md border'>
        <DatePicker
          className='flex min-w-[160px] flex-1'
          value={deliveryDate}
          onChange={handleChange}
          minDate={earliestDate}
          trigger={({ toggle, formatted }) => (
            <button
              type='button'
              onClick={toggle}
              className='border-background-alt flex flex-1 cursor-pointer flex-col gap-0.5 border-r px-3 py-4 text-left text-sm'
            >
              <div className='text-brand-primary font-bold'>Receive on:</div>
              <div className='text-foreground/60'>{formatted}</div>
            </button>
          )}
        />
        <AddressPicker
          className='flex flex-3'
          value={deliveryAddress}
          onChange={setDeliveryAddress}
          resultRowClassName='px-3'
          trigger={({ inputProps, value }) => (
            <div
              onClick={() => inputProps.ref.current?.focus()}
              className='flex flex-1 cursor-text flex-col gap-0.5 px-3 py-4 text-sm'
            >
              <div className='text-brand-primary font-bold'>Send to:</div>
              <input
                {...inputProps}
                placeholder={
                  value ? inputProps.placeholder : DEFAULT_DELIVERY_LOCATION
                }
                className={tw(
                  'text-foreground/60 w-full min-w-0 bg-transparent outline-none',
                  'placeholder:text-foreground/60 placeholder:opacity-100',
                  'placeholder:transition-colors placeholder:duration-100 focus:placeholder:text-transparent'
                )}
              />
            </div>
          )}
        />
      </div>
    </div>
  );
};
