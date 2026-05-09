import { RefObject } from 'react';
import { Product } from '@/api/products/Product';
import { ProductDetailContent } from './ProductDetailContent';

// Desktop-only sticky white card holding the buy-box content. The PDP page
// places it inside an `absolute top-0 right-[calc(7vw-42px)] h-full
// w-[calc(640/1568*100%)]` wrapper, so the card overlays the hero's right
// side and continues to stick through the content area as the user scrolls.
// Sticks below the navbar via `--navbar-offset` so it slides with the
// hide-on-scroll navbar. Mobile renders
// [`ProductDetailContent`](./ProductDetailContent.tsx) flat in document
// flow inside its own white card.

export const ProductDetailPane = ({
  product,
  addToCartRef,
}: {
  product: Product;
  addToCartRef: RefObject<HTMLButtonElement | null>;
}) => {
  return (
    <div
      className='sticky rounded-lg bg-white p-10 shadow-xl'
      style={{
        top: 'calc(var(--navbar-offset) + 40px)',
        transition: 'var(--navbar-offset-transition, none)',
      }}
    >
      <ProductDetailContent product={product} addToCartRef={addToCartRef} />
    </div>
  );
};
