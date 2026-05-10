import { useRef } from 'react';
import { DELIVERY_STEP_INFO as DELIVERY_INSTRUCTION_STEPS } from './constants';
import { DeliveryStepDetail } from './ProductDeliveryStepDetails';
import { HorizontalList } from '../common/components/HorizontalList';

export const ProductDeliveryInstructions = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className='border-brand-primary py-pdp-section pl-page flex flex-col gap-5 border-t md:gap-8 lg:gap-12'>
      <div className='font-crimson text-pdp-section-header leading-tight'>
        <span className='block'>How Your Package Will</span>
        <span className='block'>Arrive At Your Door</span>
      </div>
      <HorizontalList
        scrollRef={scrollRef}
        className='gap-5'
        outerClassName='gap-8'
      >
        {DELIVERY_INSTRUCTION_STEPS.map((step) => (
          <DeliveryStepDetail key={step.id} {...step} />
        ))}
      </HorizontalList>
    </div>
  );
};
