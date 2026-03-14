import { capitalizeString } from '@/src/common/utils/capitalizeString';
import { animated } from '@react-spring/web';
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { StarRating } from './StarRating';
import { Product } from '@/api/products/Product';
import { ProductVariant } from '@/api/products/ProductVariant';

export const ProductCard = ({
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

  const [isHovering, setIsHovering] = useState(false);

  const getDeliveryDate = (deliveryLeadTime: number | undefined) => {
    if (!deliveryLeadTime) return undefined;
    const date = new Date();
    date.setDate(date.getDate() + deliveryLeadTime);

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    visibleProduct.main_image && (
      <div className='flex flex-shrink-0 cursor-pointer flex-col gap-4'>
        <Link
          to='/products/$slug'
          params={{ slug: product.slug }}
        >
          <animated.div
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className={`relative w-full overflow-hidden rounded-md bg-gray-100 ${!fixed ? 'aspect-[43/39]' : ''}`}
          >
            <img
              className={`rounded-md object-cover ${!fixed ? 'absolute inset-0 h-full w-full' : ''}`}
              src={visibleProduct.main_image}
              alt={visibleProduct.name}
              height={fixed ? 490 : undefined}
              width={fixed ? 430 : undefined}
            />
            {visibleProduct.hover_image && isHovering && (
              <img
                className='absolute inset-0 h-full w-full rounded-md object-cover'
                src={visibleProduct.hover_image}
                alt={`${visibleProduct.name} hover`}
              />
            )}
            {visibleProduct.badge_text && detailedView && (
              <div className='border-brand-primary absolute top-4 left-4 rounded-2xl border-1 bg-white/90 px-4 py-1 text-xs font-bold'>
                {visibleProduct.badge_text}
              </div>
            )}
          </animated.div>
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
                        src={variant.main_image}
                        height={35}
                        width={35}
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
    )
  );
};
