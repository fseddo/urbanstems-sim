import { useAtom } from 'jotai';
import { CalendarIcon } from '@/src/common/icons/CalendarIcon';
import { tw } from '@/src/common/utils/tw';
import { DatePicker } from '@/src/date/DatePicker';
import { deliveryDateAtom } from '@/src/date/deliveryDateAtom';
import { CollectionListHeaderCell } from '../CollectionListHeaderCell';

export const DateCell = ({ className }: { className?: string }) => {
  const [deliveryDate, setDeliveryDate] = useAtom(deliveryDateAtom);

  return (
    <DatePicker
      className={tw('flex', className)}
      value={deliveryDate}
      onChange={setDeliveryDate}
      trigger={({ toggle, formatted }) => (
        <CollectionListHeaderCell
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
        </CollectionListHeaderCell>
      )}
    />
  );
};
