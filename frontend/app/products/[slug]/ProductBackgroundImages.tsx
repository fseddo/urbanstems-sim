import { Product } from '@/types/api';

export const ProductBackgroundImages = ({ product }: { product: Product }) => {
  return (
    <div className='absolute inset-0 flex'>
      {product.main_image && (
        <div className='w-[50%]'>
          <img
            src={product.main_image}
            alt={product.name}
            className='h-full w-full object-cover'
          />
        </div>
      )}
      {product.hover_image && (
        <div className='w-[50%] overflow-hidden'>
          <img
            src={product.hover_image}
            alt={`${product.name} - hover`}
            className='h-full w-full translate-x-[20%] scale-140 object-cover'
          />
        </div>
      )}
    </div>
  );
};
