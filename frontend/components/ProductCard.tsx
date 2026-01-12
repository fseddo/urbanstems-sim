'use client';

import { Product } from '@/types/api';
import Image from 'next/image';
import { capitalizeString } from '@/utils/capitalizeString';
import { animated } from '@react-spring/web';
import { useState } from 'react';
import { StarRating } from './StarRating';

export const ProductCard = ({ product }: { product: Product }) => {
  const [isHovering, setIsHovering] = useState(false);

  return (
    product.main_image && (
      <div className='flex flex-shrink-0 cursor-pointer flex-col gap-6'>
        <animated.div
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          className='relative'
        >
          <Image
            className='h-[490px] w-[430px] rounded-md object-cover'
            src={product.main_image}
            alt={product.name}
            width={430}
            height={490}
          />
          {product.hover_image && (
            <Image
              className={`absolute inset-0 h-[490px] w-[430px] rounded-md object-cover transition-opacity duration-300 ${
                isHovering ? 'opacity-100' : 'opacity-0'
              }`}
              //TODO: replace conditional css with tw classed logic
              src={product.hover_image}
              alt={`${product.name} hover`}
              loading='eager'
              width={430}
              height={490}
            />
          )}
        </animated.div>
        <div className='flex flex-col items-center gap-1'>
          <div className='font-crimson flex items-center justify-center text-3xl'>
            {capitalizeString(product.name)}
          </div>

          <div className='flex gap-2'>
            <div className='text-lg'>{`$${product.price_dollars}`}</div>
            <div className='text-lg line-through opacity-60'>
              {product.discounted_price_dollars != null &&
                `$${product.discounted_price_dollars}`}
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <StarRating rating={product.reviews_rating} />
            {product.reviews_count && (
              <span className='text-foreground/60 text-xs'>
                ({product.reviews_count})
              </span>
            )}
          </div>
        </div>
      </div>
    )
  );
};
