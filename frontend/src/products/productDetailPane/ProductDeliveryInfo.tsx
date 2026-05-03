import { useEffect, useMemo, useState } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { Product } from '@/api/products/Product';
import {
  DatePicker,
  addDays,
  formatDeliveryDate,
  startOfDay,
} from '@/src/date/DatePicker';
import { deliveryDateAtom } from '@/src/date/deliveryDateAtom';
import { deliveryAddressAtom } from '@/src/address/deliveryAddressAtom';

export const DeliveryInformation = ({ product }: { product: Product }) => {
  const [deliveryDate, setDeliveryDate] = useAtom(deliveryDateAtom);
  const deliveryAddress = useAtomValue(deliveryAddressAtom);
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
        <div className='text-xs text-red-600'>
          Delivery date was changed to {formatDeliveryDate(deliveryDate)} — the
          earliest available — because this product can't be delivered on{' '}
          {formatDeliveryDate(bumpedFrom)}.
        </div>
      )}
      <div className='border-background-alt flex gap-2 rounded-md border'>
        <DatePicker
          className='flex flex-1'
          value={deliveryDate}
          onChange={handleChange}
          minDate={earliestDate}
          trigger={({ toggle, formatted }) => (
            <button
              type='button'
              onClick={toggle}
              className='border-background-alt flex flex-1 cursor-pointer flex-col gap-0.5 border-r px-2 py-4 text-left text-sm'
            >
              <div className='text-brand-primary font-bold'>Receive on:</div>
              <div className='text-foreground/60'>{formatted}</div>
            </button>
          )}
        />
        <div className='flex flex-3 flex-col gap-0.5 px-2 py-4 text-sm'>
          <div className='text-brand-primary font-bold'>Send to:</div>
          <div className='text-foreground/60'>
            {deliveryAddress?.mainText ?? 'New York City, NY'}
          </div>
        </div>
      </div>
    </div>
  );
};
