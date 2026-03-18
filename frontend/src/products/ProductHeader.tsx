import { Product } from '@/api/products/Product';
import { Link } from '@tanstack/react-router';

export const ProductHeader = ({ product }: { product: Product }) => {
  return (
    <header className='bg-background-alt relative z-10 flex w-fit gap-5 rounded-sm px-4 py-1.5 text-xs'>
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
