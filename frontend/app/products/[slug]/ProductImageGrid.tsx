import { Product } from '@/types/api';
import Image from 'next/image';

export const ProductImageGrid = ({ product }: { product: Product }) => {
  return (
    <div
      className='grid gap-4'
      style={{
        gridTemplateColumns: '460px 460px',
        gridTemplateRows: '2fr 4fr',
        height: '1100px',
      }}
    >
      {/* Left column - spans 2 rows */}
      {product.main_detail_src && (
        <div className='row-span-2'>
          {product.is_main_detail_video ? (
            <video
              className='h-full w-full rounded-md object-cover'
              autoPlay
              muted
              loop
              src={product.main_detail_src}
            />
          ) : (
            <div className='relative h-full w-full'>
              <Image
                className='rounded-md object-cover'
                alt={`${product.name} detail`}
                src={product.main_detail_src}
                fill
                sizes='(max-width: 768px) 100vw, 50vw'
              />
            </div>
          )}
        </div>
      )}

      {/* Right column - top row (smaller) */}
      {product.detail_image_1_src && (
        <div className='relative h-full w-full'>
          <Image
            className='rounded-md object-cover'
            alt={`${product.name} detail 1`}
            src={product.detail_image_1_src}
            fill
            sizes='(max-width: 768px) 100vw, 50vw'
          />
        </div>
      )}

      {/* Right column - bottom row (2x taller) */}
      {product.detail_image_2_src && (
        <div className='relative h-full w-full'>
          <Image
            className='rounded-md object-cover'
            alt={`${product.name} detail 2`}
            src={product.detail_image_2_src}
            fill
            sizes='(max-width: 768px) 100vw, 50vw'
          />
        </div>
      )}
    </div>
  );
};
