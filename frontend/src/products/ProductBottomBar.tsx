import { useEffect, useState, RefObject } from 'react';
import { Product } from '@/api/products/Product';
import { StarRating } from '../common/components/StarRating';
import { useIsDesktop } from '../common/hooks/useIsDesktop';
import { tw } from '../common/utils/tw';
import { useAddToBagButton } from './useAddToBagButton';

export const ProductBottomBar = ({
  product,
  addToCartRef,
}: {
  product: Product;
  addToCartRef: RefObject<HTMLButtonElement | null>;
}) => {
  const [visible, setVisible] = useState(false);
  const { setPrice, addToBag } = useAddToBagButton(product);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    const button = addToCartRef.current;
    if (!button) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const scrolledPast =
          !entry.isIntersecting && entry.boundingClientRect.bottom < 0;
        setVisible(scrolledPast);
      },
      { threshold: 0 }
    );

    observer.observe(button);
    return () => observer.disconnect();
  }, [addToCartRef]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--bottom-bar-height',
      visible ? '72px' : '0px'
    );
    return () => {
      document.documentElement.style.setProperty('--bottom-bar-height', '0px');
    };
  }, [visible]);

  return (
    <div
      className='fixed right-0 bottom-0 left-0 z-30 flex items-center gap-3 bg-white px-4 py-4 shadow-md transition-transform duration-300 lg:justify-between lg:px-8 lg:py-4'
      style={{ transform: visible ? 'translateY(0)' : 'translateY(100%)' }}
    >
      <div
        className={tw(
          'flex min-w-0 items-center gap-6 2xl:gap-12',
          'transition-[flex-grow] duration-300',
          isDesktop ? 'flex-grow' : 'flex-grow-0'
        )}
      >
        <div className='flex shrink-0 items-center gap-4'>
          {product.main_image && (
            <img
              src={product.main_image}
              alt={product.name}
              className='h-[clamp(40px,calc(40px+(100vw-240px)*24/60),64px)] w-[clamp(40px,calc(40px+(100vw-240px)*24/60),64px)] object-cover shadow-md'
            />
          )}
          {isDesktop && (
            <div className='font-crimson animate-fade-in text-[clamp(24px,calc(24px+(100vw-1024px)*12/376),36px)]'>
              {product.name}
            </div>
          )}
        </div>
        {isDesktop && (
          <div className='animate-fade-in flex min-w-0 flex-col'>
            {product.reviews_count && (
              <div className='flex gap-2'>
                <StarRating rating={product.reviews_rating} />
                <a
                  href='#reviews'
                  className='text-brand-primary text-xs underline'
                >
                  {product.reviews_count} Reviews
                </a>
              </div>
            )}
            <div className='truncate text-sm'>{product.subtitle}</div>
          </div>
        )}
      </div>
      <button
        onClick={addToBag}
        className={tw(
          'bg-brand-primary tracking-action shrink-0 rounded-sm border px-[clamp(32px,calc(32px+(100vw-1024px)*64/376),96px)] py-4.5 text-xs font-extrabold whitespace-nowrap text-white/90',
          'hover:border-brand-primary hover:text-brand-primary hover:bg-white active:scale-95',
          'transition-[color,background-color,border-color,padding,flex-grow] duration-300',
          isDesktop ? 'flex-grow-0' : 'flex-grow'
        )}
      >
        ADD TO BAG
        <span className='hidden min-[300px]:inline'>
          {` - $${setPrice}`}
        </span>
      </button>
    </div>
  );
};
