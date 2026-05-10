import { Product } from '@/api/products/Product';
import { imageAtWidth } from '@/src/common/utils/imageAtWidth';

type Props = {
  product: Product;
  onAdd: () => void;
  onLearnMore: () => void;
};

export const AddonRow = ({ product, onAdd, onLearnMore }: Props) => (
  <div className='border-background-alt flex gap-3 rounded-md border p-3'>
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
        <button
          onClick={onAdd}
          className='border-background-alt hover:bg-brand-primary hover:border-brand-primary tracking-action rounded-sm border px-6 py-2 text-xs font-extrabold transition-colors duration-300 hover:text-white active:scale-[0.99]'
        >
          ADD
        </button>
        <button
          onClick={onLearnMore}
          className='text-brand-primary text-xs underline transition-opacity hover:opacity-70'
        >
          Learn More
        </button>
      </div>
    </div>
  </div>
);
