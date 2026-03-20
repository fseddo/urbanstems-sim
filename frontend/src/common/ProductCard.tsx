import { capitalizeString } from '@/src/common/utils/capitalizeString';
import { memo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { StarRating } from './StarRating';
import { Product } from '@/api/products/Product';
import { ProductVariant } from '@/api/products/ProductVariant';
import { getDeliveryDate } from '../products/constants';

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
      <Link
        to='/products/$slug'
        params={{ slug: product.slug }}
        className='flex flex-shrink-0 cursor-pointer flex-col gap-4'
      >
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
          {visibleProduct.badge_image_src && detailedView && (
            <div className='absolute right-8 bottom-10'>
              <img
                src={`${visibleProduct.badge_image_src}&width=240`}
                className='h-35'
              />
            </div>
          )}
        </div>

        <div className='flex flex-col items-center gap-1'>
          {visibleProduct.delivery_lead_time != null && !fixed && (
            <div className='border-brand-primary/10 rounded-2xl border-1 bg-white/90 px-4 py-1 text-xs font-semibold'>
              Receive on{' '}
              {getDeliveryDate(visibleProduct.delivery_lead_time, 'short')}
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
                        className={`rounded-full object-cover ${variant.variant_type === visibleProduct.variant_type ? 'ring-brand-primary ring-1 ring-offset-2 ring-offset-white' : 'hover:ring-1 hover:ring-gray-300 hover:ring-offset-2 hover:ring-offset-white'}`}
                        alt={variant.variant_type}
                        src={`${variant.main_image}&width=700`}
                        height={30}
                        width={30}
                      />
                      <div
                        key={variant.id}
                        className={`text-[10px] ${variant.variant_type === visibleProduct.variant_type ? 'text-brand-primary font-extrabold' : 'opacity-70'}`}
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
