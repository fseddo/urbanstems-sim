import { Product } from '@/api/products/Product';
import { imageAtWidth } from '@/src/common/utils/imageAtWidth';

export const ProductBackgroundImages = ({ product }: { product: Product }) => {
  return (
    <div className='absolute inset-0 flex bg-cover bg-center bg-no-repeat'>
      {product.main_image && (
        <div className='w-[50%]'>
          <img
            src={imageAtWidth(product.main_image, 1600)}
            alt={product.name}
            className='h-full w-full object-cover'
          />
        </div>
      )}
      {product.hover_image && (
        <div className='w-[50%] overflow-hidden'>
          <img
            src={imageAtWidth(product.hover_image, 1600)}
            alt={`${product.name} - hover`}
            className='h-full w-full translate-x-[20%] scale-140 object-cover'
          />
        </div>
      )}
    </div>
  );
};
