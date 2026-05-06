import { atomWithStorage } from 'jotai/utils';

export interface DeliveryAddress {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  lat: number | null;
  lng: number | null;
}

export const DEFAULT_DELIVERY_LOCATION = 'New York City, NY';

export const deliveryAddressAtom = atomWithStorage<DeliveryAddress | null>(
  'urbanstems-delivery-address',
  null,
  undefined,
  { getOnInit: true }
);
