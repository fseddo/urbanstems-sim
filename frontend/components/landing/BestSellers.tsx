'use client';

import { Product } from '@/types/api';
import { useRef, useState } from 'react';
import HorizontalScrollbar from '../HorizontalScrollbar';
import { animated } from '@react-spring/web';
import Image from 'next/image';
import { capitalizeString } from '@/utils/capitalizeString';
import { StarRating } from '../StarRating';

interface BestSellersProps {
  flowers: Product[];
  plants: Product[];
}

export default ({ flowers, plants }: BestSellersProps) => {
  const [selectedProductCategory, setSelectedProductCategory] =
    useState('flowers');
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section className='flex w-full flex-col gap-6 py-10 pl-20'>
      <header className='font-crimson text-[52px] font-medium'>
        Shop Our Best Sellers
      </header>
      <div className='flex w-full flex-col pr-20'>
        <div className='flex gap-5 pb-2'>
          <div
            onClick={() => setSelectedProductCategory('flowers')}
            className={`cursor-pointer ${selectedProductCategory === 'flowers' ? 'text-foreground underline decoration-[2.5px] underline-offset-12' : 'text-foreground/40'}`}
          >
            Flowers
          </div>
          {/* TODO: make resuable component */}
          <div
            onClick={() => setSelectedProductCategory('plants')}
            className={`cursor-pointer ${selectedProductCategory === 'plants' ? 'text-foreground underline decoration-[2.5px] underline-offset-12' : 'text-foreground/40'}`}
          >
            Plants
          </div>
        </div>
        <div className='w-full border-b-1 opacity-40' />
      </div>
      <div className='flex w-full flex-col gap-14'>
        <div
          className='hide-scrollbar flex gap-6 overflow-x-auto overflow-y-hidden pr-20'
          ref={scrollRef}
        >
          {selectedProductCategory === 'flowers' &&
            flowers?.flatMap((flower, idx) =>
              idx < 8 ? [<ProductCard key={flower.id} product={flower} />] : []
            )}
          {/* TODO: clean up this display logic */}
          {selectedProductCategory === 'plants' &&
            plants?.flatMap((plant, idx) =>
              idx < 8 ? [<ProductCard key={plant.id} product={plant} />] : []
            )}
        </div>
        <HorizontalScrollbar targetRef={scrollRef} />
      </div>
    </section>
  );
};

const ProductCard = ({ product }: { product: Product }) => {
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
