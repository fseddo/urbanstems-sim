import { Product } from '@/types/api';
import { getDeliveryDate } from '../constants';

export const DeliveryInformation = ({ product }: { product: Product }) => {
  return (
    <div className='flex w-full flex-col gap-2 pb-4'>
      <div className='font-bold'>Delivery Information</div>
      <div className='border-background-alt flex gap-2 rounded-md border'>
        <div className='border-background-alt flex flex-1 flex-col gap-0.5 border-r px-2 py-4 text-sm'>
          <div className='text-brand-primary font-bold'>Receive on:</div>
          <div className='text-foreground/60'>
            {getDeliveryDate(product.delivery_lead_time)}
          </div>
        </div>
        <div className='flex flex-3 flex-col gap-0.5 px-2 py-4 text-sm'>
          <div className='text-brand-primary font-bold'>Send to:</div>
          <div className='text-foreground/60'>New York City, NY</div>
        </div>
      </div>
    </div>
  );
};
