import { FiMinus, FiPlus } from 'react-icons/fi';
import { Product } from '@/api/products/Product';
import { imageAtWidth } from '@/src/common/utils/imageAtWidth';
import { tw } from '@/src/common/utils/tw';

// Discriminated action drives what renders in the row's action slot:
//   'add'     — ADD button (unselected row)
//   'remove'  — REMOVE button (vase already pending/attached)
//   'stepper' — −  N  + (gift with count > 0)
export type AddonRowAction =
  | { kind: 'add'; onAdd: () => void }
  | { kind: 'remove'; onRemove: () => void }
  | {
      kind: 'stepper';
      count: number;
      onIncrement: () => void;
      onDecrement: () => void;
    };

type Props = {
  product: Product;
  action: AddonRowAction;
  onLearnMore: () => void;
};

export const AddonRow = ({ product, action, onLearnMore }: Props) => {
  const highlighted = action.kind !== 'add';
  return (
    <div
      className={tw(
        'flex gap-3 rounded-md border p-3',
        highlighted ? 'border-brand-primary' : 'border-background-alt'
      )}
    >
      {product.main_image && (
        <img
          src={imageAtWidth(product.main_image, 400)}
          alt={product.name}
          className='h-[114px] w-[98px] shrink-0 rounded-sm object-cover'
        />
      )}
      <div className='flex flex-1 flex-col gap-2'>
        <div className='flex items-baseline justify-between gap-2'>
          <div className='text-sm leading-tight font-bold'>{product.name}</div>
          <div className='shrink-0 text-sm font-bold'>
            ${product.price_dollars}
          </div>
        </div>
        {product.subtitle && (
          <div className='text-xs leading-snug opacity-70'>
            {product.subtitle}
          </div>
        )}
        <div className='mt-auto flex items-center justify-between gap-2'>
          <ActionSlot action={action} />
          <button
            onClick={onLearnMore}
            className='text-brand-primary min-w-[68px] text-xs underline transition-opacity hover:opacity-70'
          >
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
};

const ActionSlot = ({ action }: { action: AddonRowAction }) => {
  if (action.kind === 'add') {
    return (
      <button
        onClick={action.onAdd}
        className='border-background-alt hover:bg-brand-primary hover:border-brand-primary tracking-action rounded-sm border px-6 py-2 text-xs font-extrabold transition-colors duration-300 hover:text-white active:scale-[0.99]'
      >
        ADD
      </button>
    );
  }
  if (action.kind === 'remove') {
    return (
      <button
        onClick={action.onRemove}
        className='border-brand-primary tracking-action hover:bg-brand-primary rounded-sm border px-6 py-2 text-xs font-extrabold transition-colors duration-300 hover:text-white active:scale-[0.99]'
      >
        REMOVE
      </button>
    );
  }
  return (
    <div className='border-brand-primary flex items-center gap-3 rounded-sm border px-3 py-1.5 text-sm'>
      <button
        onClick={action.onDecrement}
        aria-label='Decrease'
        className='transition-opacity hover:opacity-60'
      >
        <FiMinus size={14} />
      </button>
      <span className='min-w-[1ch] text-center font-bold'>{action.count}</span>
      <button
        onClick={action.onIncrement}
        aria-label='Increase'
        className='transition-opacity hover:opacity-60'
      >
        <FiPlus size={14} />
      </button>
    </div>
  );
};
