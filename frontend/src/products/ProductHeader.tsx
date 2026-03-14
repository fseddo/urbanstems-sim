import { Product } from '@/api/products/Product';
import { Link } from '@tanstack/react-router';

export const ProductHeader = ({ product }: { product: Product }) => {
  return (
    <header className='relative z-10 flex gap-4 text-xs'>
      <Link to='/'>
        <div className='underline'>Home</div>
      </Link>
      <Link to='/collections/$slug' params={{ slug: 'all' }}>
        <div className='underline'>Shop All</div>
      </Link>
      <div className='opacity-80'>{product.name}</div>
    </header>
  );
};
