import { StarRating } from '@/components/StarRating';
import { Product } from '@/types/api';
import { getFirstSentence } from '../constants';
import { AddOns } from './ProductAddOns';
import { DeliveryInformation } from './ProductDeliveryInfo';
import { ProductDetailVariantOptions } from './ProductDetailVariantOptions';

export const ProductDetailPane = ({
  product,
  navbarHeight,
}: {
  product: Product;
  navbarHeight: number;
}) => {
  return (
    <div className='absolute top-0 right-[90px] z-10 h-full pb-20'>
      <div
        className='sticky flex w-[37vw] flex-col items-center gap-3 rounded-lg bg-white p-10 shadow-xl'
        style={{ top: navbarHeight + 40 }}
      >
        {/* review rating */}
        <div className='flex items-center gap-2'>
          <StarRating rating={product.reviews_rating} />
          {product.reviews_count && (
            <span className='text-brand-primary text-xs underline'>
              {product.reviews_count} Reviews
            </span>
          )}
        </div>
        {/* name */}
        <div className='font-crimson text-5xl'>{product.name}</div>
        <div className='text-center text-sm'>
          {getFirstSentence(product.description)}
        </div>
        {/* price */}
        <div className='flex gap-2 text-lg'>
          <div>{`$${product.price_dollars}`}</div>
          <div className='line-through opacity-60'>
            {product.discounted_price_dollars != null &&
              `$${product.discounted_price_dollars}`}
          </div>
        </div>
        {/* variants */}
        <ProductDetailVariantOptions product={product} />

        {/* delivery options */}
        <DeliveryInformation product={product} />

        {/* add ons */}
        <AddOns />

        <button className='bg-brand-primary hover:border-brand-primary hover:text-brand-primary w-full rounded-md border py-4 text-sm font-bold tracking-wider text-white transition-colors duration-300 hover:bg-white active:scale-95'>
          {`ADD TO BAG - $${product.price_dollars}`}
        </button>
      </div>
    </div>
  );
};
