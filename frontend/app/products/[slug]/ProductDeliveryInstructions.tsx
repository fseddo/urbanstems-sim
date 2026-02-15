import { Product } from '@/types/api';
import { DELIVERY_STEP_INFO as DELIVERY_INSTRUCTION_STEPS } from './constants';
import { DeliveryStepDetail } from './ProductDeliveryStepDetails';

export const ProductDeliveryInstructions = ({
  product,
}: {
  product: Product;
}) => {
  return (
    <div className='border-brand-primary flex flex-col gap-12 border-t px-50 py-20'>
      <div className='font-crimson w-[40%] text-6xl'>
        How Your Package Will Arrive At Your Door
      </div>
      <div className='flex gap-5'>
        {DELIVERY_INSTRUCTION_STEPS.map((step) => (
          <DeliveryStepDetail key={step.id} {...step} />
        ))}
      </div>
    </div>
  );
};
