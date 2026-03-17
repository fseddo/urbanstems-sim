import { capitalizeString } from '@/src/common/utils/capitalizeString';
import { memo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { StarRating } from './StarRating';
import { Product } from '@/api/products/Product';
import { ProductVariant } from '@/api/products/ProductVariant';

const getDeliveryDate = (deliveryLeadTime: number | undefined) => {
  if (!deliveryLeadTime) return undefined;
  const date = new Date();
  date.setDate(date.getDate() + deliveryLeadTime);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const ProductCard = memo(
  ({
    product,
    fixed = false,
    detailedView,
  }: {
    product: Product;
    fixed?: boolean;
    detailedView?: boolean;
  }) => {
    const [visibleProduct, setVisibleProduct] = useState<
      Product | ProductVariant
    >(product);

    if (!visibleProduct.main_image) return null;

    return (
      <div className='flex flex-shrink-0 cursor-pointer flex-col gap-4'>
        <Link to='/products/$slug' params={{ slug: product.slug }}>
          <div
            className={`group relative w-full overflow-hidden rounded-md bg-gray-100 bg-cover bg-center bg-no-repeat ${!fixed ? 'aspect-[43/39]' : ''}`}
            style={
              product.blur_data_url
                ? { backgroundImage: `url(${product.blur_data_url})` }
                : undefined
            }
          >
            <img
              className={`rounded-md object-cover opacity-0 transition-opacity duration-300 ${!fixed ? 'absolute inset-0 h-full w-full' : ''}`}
              src={`${visibleProduct.main_image}&width=700`}
              alt={visibleProduct.name}
              height={fixed ? 490 : undefined}
              width={fixed ? 430 : undefined}
              onLoad={(e) => e.currentTarget.classList.remove('opacity-0')}
            />
            {visibleProduct.hover_image && (
              <img
                className='absolute inset-0 h-full w-full rounded-md object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100'
                src={`${visibleProduct.hover_image}&width=700`}
                alt={`${visibleProduct.name} hover`}
              />
            )}
            {visibleProduct.badge_text && detailedView && (
              <div className='border-brand-primary absolute top-4 left-4 rounded-2xl border-1 bg-white/90 px-4 py-1 text-xs font-bold'>
                {visibleProduct.badge_text}
              </div>
            )}
          </div>
        </Link>

        <div className='flex flex-col items-center gap-1.5'>
          {visibleProduct.delivery_lead_time && (
            <div className='border-brand-primary/10 rounded-2xl border-1 bg-white/90 px-4 py-1 text-xs font-semibold'>
              Receive on {getDeliveryDate(visibleProduct.delivery_lead_time)}
            </div>
          )}
          <div className='font-crimson flex items-center justify-center text-[clamp(15px,1.5vw,30px)]'>
            {capitalizeString(visibleProduct.name)}
          </div>

          <div className='flex gap-2 text-[clamp(12px,1.5vw,18px)]'>
            <div>{`$${visibleProduct.price_dollars}`}</div>
            <div className='line-through opacity-60'>
              {visibleProduct.discounted_price_dollars != null &&
                `$${visibleProduct.discounted_price_dollars}`}
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <StarRating rating={product.reviews_rating} />
            {product.reviews_count && (
              <span className='text-brand-primary text-xs'>
                ({product.reviews_count})
              </span>
            )}
          </div>
          {detailedView && product.variants && product.variants.length > 1 && (
            <div className='flex gap-4 py-1'>
              {product.variants.map((variant) => {
                return (
                  variant.main_image && (
                    <div
                      className='flex flex-col items-center justify-center gap-2'
                      key={variant.id}
                    >
                      <img
                        onClick={() => setVisibleProduct(variant)}
                        className={`rounded-full object-cover ${variant.variant_type === visibleProduct.variant_type ? 'border-brand-primary border-2' : ''}`}
                        alt={variant.variant_type}
                        src={`${variant.main_image}&width=700`}
                        height={35}
                        width={35}
                        // loading='lazy'
                        // decoding='async'
                      />
                      <div
                        key={variant.id}
                        className={`text-[10px] ${variant.variant_type === visibleProduct.variant_type ? 'text-brand-primary font-bold' : 'opacity-60'}`}
                      >
                        {variant.variant_type}
                      </div>
                    </div>
                  )
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }
);
