import { Product } from '@/api/products/Product';
import { capitalizeString } from '@/src/common/utils/capitalizeString';
import { FaCheck } from 'react-icons/fa';
import { VARIANT_TYPE_TO_PRODUCT_SIZE } from '../constants';
import { Link } from '@tanstack/react-router';
import { tw } from '@/src/common/utils/tw';

export const ProductDetailVariantOptions = ({
  product,
}: {
  product: Product;
}) => {
  return (
    product.variants &&
    product.variants.length > 1 && (
      <div className='flex w-full gap-4 py-4'>
        {product.variants.map((variant) => {
          return (
            variant.main_image && (
              <Link
                to='/products/$slug'
                params={{ slug: variant.slug }}
                className={tw(
                  'relative flex grow flex-col items-center justify-center gap-2 rounded-sm p-4',
                  variant.variant_type === product?.variant_type
                    ? 'border-brand-primary cursor-default border-2'
                    : 'border-background-alt cursor-pointer border'
                )}
                key={variant.id}
              >
                {variant.variant_type === product?.variant_type && (
                  <div className='bg-brand-primary absolute top-0 left-0 rounded-br-sm p-2'>
                    <FaCheck color='white' size={12} />
                  </div>
                )}
                <img
                  className='aspect-square rounded-full'
                  alt={variant.variant_type}
                  src={`${variant.main_image}&width=700`}
                  height={80}
                  width={80}
                />
                {/* variant text info */}
                <div className='flex flex-col items-center gap-0.5'>
                  <div
                    className={tw(
                      'text-base font-bold',
                      variant.variant_type === product?.variant_type
                        ? 'text-brand-primary'
                        : 'opacity-60'
                    )}
                  >
                    {capitalizeString(variant.variant_type)}
                  </div>
                  <div className='text-brand-primary text-xs'>
                    {VARIANT_TYPE_TO_PRODUCT_SIZE[variant.variant_type]}
                  </div>
                  <div className='text-xs italic opacity-60'>
                    {variant.discounted_price_dollars && variant.price_dollars
                      ? `Save ${Math.round(((variant.discounted_price_dollars - variant.price_dollars) / variant.discounted_price_dollars) * 100)}%`
                      : 'Classic Size'}
                  </div>
                </div>
              </Link>
            )
          );
        })}
      </div>
    )
  );
};
