import { atomWithStorage } from 'jotai/utils';

export interface DeliveryAddress {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  lat: number | null;
  lng: number | null;
}

export const deliveryAddressAtom = atomWithStorage<DeliveryAddress | null>(
  'urbanstems-delivery-address',
  null
);
