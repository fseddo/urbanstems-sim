import { DELIVERY_STEP_INFO as DELIVERY_INSTRUCTION_STEPS } from './constants';
import { DeliveryStepDetail } from './ProductDeliveryStepDetails';

export const ProductDeliveryInstructions = () => {
  return (
    // TODO: gutter is `px-page` for now to avoid horizontal overflow at
    // narrow viewports. The design has a wider-than-page gutter at desktop
    // (more indented than `<ProductRecommendations>`) and a page-aligned
    // gutter at mobile — when revisiting, introduce a dedicated token
    // rather than reusing `px-page`. See `docs/frontend/features/products.md`.
    <div className='border-brand-primary py-pdp-section flex flex-col gap-12 border-t px-page'>
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
