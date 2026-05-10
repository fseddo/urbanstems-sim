import { RefObject } from 'react';
import { Product } from '@/api/products/Product';
import { StarRating } from '@/src/common/components/StarRating';
import { AddOns } from './ProductAddOns';
import { DeliveryInformation } from './ProductDeliveryInfo';
import { ProductDetailVariantOptions } from './ProductDetailVariantOptions';
import { ProductInfoAccordion } from '../ProductInfoAccordion';
import { useAddToBagButton } from '../useAddToBagButton';
import { useIsDesktop } from '@/src/common/hooks/useIsDesktop';
import { tw } from '@/src/common/utils/tw';

// The actual content of the product-detail buy-box: rating, name + subtitle,
// price, variant options, delivery information, add-ons, add-to-cart button.
// Lives here so both desktop and mobile PDP layouts can render it — desktop
// wraps it in [`ProductDetailPane`](./ProductDetailPane.tsx)'s sticky white
// pane, mobile renders it flat in document flow.
//
// Description + Care Instructions accordions are rendered inside on mobile
// (between Delivery Information and Add-Ons). On any desktop size they're
// rendered separately in `<ProductDetailPage>`'s left content column below
// the image grid, matching the reference's `.pdp__secondary` zone. Both
// `accordionsInPane` here and `accordionsExternal` over there derive from
// `isDesktop` — they're inverses by construction, so the accordions render
// in exactly one location.
//
// Default open state follows the location: external (desktop) opens
// Description by default, in-pane (mobile) keeps both closed. Care
// Instructions defaults closed everywhere.

export const ProductDetailContent = ({
  product,
  addToCartRef,
}: {
  product: Product;
  addToCartRef: RefObject<HTMLButtonElement | null>;
}) => {
  const isDesktop = useIsDesktop();
  const accordionsInPane = !isDesktop;
  const { setPrice, addToBag } = useAddToBagButton(product);
  return (
    <div
      className={tw(
        'flex w-full flex-col items-center gap-3',
        !isDesktop && 'gap-1.5'
      )}
    >
      <div className='flex items-center gap-2'>
        <StarRating rating={product.reviews_rating} />
        {product.reviews_count && (
          <a href='#reviews' className='text-brand-primary text-xs underline'>
            {product.reviews_count} Reviews
          </a>
        )}
      </div>
      <div
        className={tw(
          'font-crimson text-center text-5xl',
          !isDesktop && 'text-3xl'
        )}
      >
        {product.name}
      </div>
      <div className='text-center text-sm'>{product.subtitle}</div>
      <div className='flex gap-2 text-lg'>
        <div>{`$${product.price_dollars}`}</div>
        <div className='line-through opacity-60'>
          {product.discounted_price_dollars != null &&
            `$${product.discounted_price_dollars}`}
        </div>
      </div>
      <ProductDetailVariantOptions product={product} />
      <DeliveryInformation product={product} />
      {accordionsInPane && (
        <div className='mb-4 flex w-full flex-col'>
          <ProductInfoAccordion
            label='Description'
            data={product.description}
          />
          <ProductInfoAccordion
            label='Care Instructions'
            data={product.care_instructions}
          />
        </div>
      )}
      <AddOns product={product} />
      <button
        ref={addToCartRef}
        onClick={addToBag}
        className='bg-brand-primary hover:border-brand-primary hover:text-brand-primary w-full rounded-md border py-4 text-sm font-bold tracking-action text-white transition-colors duration-300 hover:bg-white active:scale-95'
      >
        {`ADD TO BAG - $${setPrice}`}
      </button>
    </div>
  );
};
