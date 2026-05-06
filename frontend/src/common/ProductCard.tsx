import { capitalizeString } from '@/src/common/utils/capitalizeString';
import { imageAtWidth } from '@/src/common/utils/imageAtWidth';
import { memo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { StarRating } from './StarRating';
import { Product } from '@/api/products/Product';
import { ProductVariant } from '@/api/products/ProductVariant';
import { getDeliveryDate } from '../products/constants';
import { tw } from './utils/tw';

export const ProductCard = memo(
  ({
    product,
    compact = false,
  }: {
    product: Product;
    compact?: boolean;
  }) => {
    const [visibleProduct, setVisibleProduct] = useState<
      Product | ProductVariant
    >(product);

    if (!visibleProduct.main_image) return null;

    return (
      <Link
        to='/products/$slug'
        params={{ slug: product.slug }}
        className='@container flex w-full cursor-pointer flex-col gap-4'
      >
        <div
          className='group relative w-full overflow-hidden rounded-md bg-gray-100 bg-cover bg-center bg-no-repeat aspect-[3/4] @[300px]:aspect-[4/5] @[500px]:aspect-[43/39]'
          style={
            product.blur_data_url
              ? { backgroundImage: `url(${product.blur_data_url})` }
              : undefined
          }
        >
          <img
            className='absolute inset-0 h-full w-full rounded-md object-cover opacity-0 transition-opacity duration-300'
            src={imageAtWidth(visibleProduct.main_image, 700)}
            alt={visibleProduct.name}
            onLoad={(e) => e.currentTarget.classList.remove('opacity-0')}
          />
          {visibleProduct.hover_image && (
            <img
              className='absolute inset-0 h-full w-full rounded-md object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100'
              src={imageAtWidth(visibleProduct.hover_image, 700)}
              alt={`${visibleProduct.name} hover`}
            />
          )}
          {visibleProduct.badge_text && !compact && (
            <div className='border-brand-primary absolute top-4 left-4 rounded-2xl border-1 bg-white/90 px-4 py-1 text-xs font-bold'>
              {visibleProduct.badge_text}
            </div>
          )}
          {visibleProduct.badge_image_src && (
            <img
              src={imageAtWidth(visibleProduct.badge_image_src, 240)}
              className='absolute right-[5%] bottom-[5%] h-[23%] w-auto'
            />
          )}
        </div>

        <div className='flex flex-col items-center gap-1'>
          {visibleProduct.delivery_lead_time != null && !compact && (
            <div className='border-brand-primary/10 rounded-2xl border-1 bg-white/90 px-4 py-1 text-xs font-semibold'>
              Receive on{' '}
              {getDeliveryDate(visibleProduct.delivery_lead_time, 'short')}
            </div>
          )}
          <div
            className={tw(
              'font-crimson flex items-center justify-center',
              compact ? 'text-base' : 'text-[clamp(15px,1.5vw,30px)]'
            )}
          >
            {capitalizeString(visibleProduct.name)}
          </div>

          <div
            className={tw(
              'flex gap-2',
              compact ? 'text-sm' : 'text-[clamp(12px,1.5vw,18px)]'
            )}
          >
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
          {!compact && product.variants && product.variants.length > 1 && (
            <div className='flex gap-1'>
              {product.variants.map((variant) => {
                return (
                  variant.main_image && (
                    <div
                      className='flex flex-col items-center justify-center gap-2 p-2'
                      key={variant.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setVisibleProduct(variant);
                      }}
                    >
                      <img
                        className={tw(
                          'rounded-full object-cover',
                          variant.variant_type === visibleProduct.variant_type
                            ? 'ring-brand-primary ring-1 ring-offset-2 ring-offset-white'
                            : 'hover:ring-1 hover:ring-gray-300 hover:ring-offset-2 hover:ring-offset-white'
                        )}
                        alt={variant.variant_type}
                        src={imageAtWidth(variant.main_image, 700)}
                        height={30}
                        width={30}
                      />
                      <div
                        key={variant.id}
                        className={tw(
                          'text-[10px]',
                          variant.variant_type === visibleProduct.variant_type
                            ? 'text-brand-primary font-extrabold'
                            : 'opacity-70'
                        )}
                      >
                        {capitalizeString(variant.variant_type)}
                      </div>
                    </div>
                  )
                );
              })}
            </div>
          )}
        </div>
      </Link>
    );
  }
);
