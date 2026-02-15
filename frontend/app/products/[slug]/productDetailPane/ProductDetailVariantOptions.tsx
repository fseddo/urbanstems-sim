import { Product } from '@/types/api';
import { capitalizeString } from '@/utils/capitalizeString';
import Link from 'next/link';
import { FaCheck } from 'react-icons/fa';
import { VARIANT_TYPE_TO_PRODUCT_SIZE } from '../constants';
import Image from 'next/image';

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
                href={`/products/${variant.id}`}
                className={`relative flex grow flex-col items-center justify-center gap-2 rounded-sm p-4 ${variant.variant_type === product?.variant_type ? 'border-brand-primary cursor-default border-2' : 'border-background-alt cursor-pointer border'}`}
                key={variant.id}
              >
                {variant.variant_type === product?.variant_type && (
                  <div className='bg-brand-primary absolute top-0 left-0 rounded-br-sm p-2'>
                    <FaCheck color='white' size={12} />
                  </div>
                )}
                <Image
                  className='aspect-square rounded-full'
                  alt={variant.variant_type}
                  src={variant.main_image}
                  height={80}
                  width={80}
                />
                {/* variant text info */}
                <div className='flex flex-col items-center gap-0.5'>
                  <div
                    className={`text-base font-bold ${variant.variant_type === product?.variant_type ? 'text-brand-primary' : 'opacity-60'}`}
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
