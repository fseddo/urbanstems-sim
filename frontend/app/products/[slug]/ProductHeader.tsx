import { Product } from '@/types/api';
import Link from 'next/link';

export const ProductHeader = ({ product }: { product: Product }) => {
  return (
    <header className='relative z-10 flex gap-4 text-xs'>
      <Link href={'/'}>
        <div className='underline'>Home</div>
      </Link>
      <Link href={'/collections'}>
        <div className='underline'>Shop All</div>
      </Link>
      <div className='opacity-80'>{product.name}</div>
    </header>
  );
};
