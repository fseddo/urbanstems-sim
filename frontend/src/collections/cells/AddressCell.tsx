import { useAtom } from 'jotai';
import { SlLocationPin } from 'react-icons/sl';
import { AddressPicker } from '@/src/address/AddressPicker';
import {
  DEFAULT_DELIVERY_LOCATION,
  deliveryAddressAtom,
} from '@/src/address/deliveryAddressAtom';
import { tw } from '@/src/common/utils/tw';
import { CollectionListHeaderCell } from '../CollectionListHeaderCell';

export const AddressCell = () => {
  const [deliveryAddress, setDeliveryAddress] = useAtom(deliveryAddressAtom);

  return (
    <AddressPicker
      className={tw('flex flex-3')}
      value={deliveryAddress}
      onChange={setDeliveryAddress}
      resultRowClassName='lg:px-listing-cell'
      trigger={({ inputProps, label, value }) => (
        <CollectionListHeaderCell
          Icon={SlLocationPin}
          className={tw('flex-3 cursor-text', 'lg:px-listing-cell')}
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
        </CollectionListHeaderCell>
      )}
    />
  );
};
