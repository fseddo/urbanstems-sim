import { useEffect, useState, RefObject } from 'react';
import { useSetAtom } from 'jotai';
import { Product } from '@/api/products/Product';
import { addToCartAtom } from '../cart/cartAtoms';
import { StarRating } from '../common/StarRating';

export const ProductBottomBar = ({
  product,
  addToCartRef,
}: {
  product: Product;
  addToCartRef: RefObject<HTMLButtonElement | null>;
}) => {
  const [visible, setVisible] = useState(false);
  const addToCart = useSetAtom(addToCartAtom);

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
      className='fixed right-0 bottom-0 left-0 z-50 flex items-center justify-between bg-white px-8 py-4 shadow-md transition-transform duration-300'
      style={{ transform: visible ? 'translateY(0)' : 'translateY(100%)' }}
    >
      <div className='flex items-center gap-12'>
        <div className='flex items-center gap-4'>
          {product.main_image && (
            <img
              src={product.main_image}
              alt={product.name}
              className='h-16 w-16 object-cover shadow-md'
            />
          )}
          <div className='font-crimson text-4xl'>{product.name}</div>
        </div>

        <div className='flex flex-col'>
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
          <div className='text-sm'>{product.subtitle}</div>
        </div>
      </div>
      <button
        onClick={() => addToCart(product)}
        className='bg-brand-primary hover:border-brand-primary hover:text-brand-primary rounded-md border px-70 py-5 text-xs font-black tracking-wider text-white/90 transition-colors duration-300 hover:bg-white active:scale-95'
      >
        {`ADD TO BAG - $${product.price_dollars}`}
      </button>
    </div>
  );
};
