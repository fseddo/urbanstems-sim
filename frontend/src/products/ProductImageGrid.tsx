import { Product } from '@/api/products/Product';

export const ProductImageGrid = ({ product }: { product: Product }) => {
  const hasBothDetailImages =
    product.detail_image_1_src && product.detail_image_2_src;

  return (
    <div
      className='grid gap-4'
      style={{
        gridTemplateColumns: '460px 460px',
        gridTemplateRows: hasBothDetailImages ? '2fr 4fr' : '1fr',
        height: '1100px',
      }}
    >
      {/* Left column - spans 2 rows */}
      {product.main_detail_src && (
        <div className={hasBothDetailImages ? 'row-span-2' : ''}>
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
              <img
                className='absolute inset-0 h-full w-full rounded-md object-cover'
                alt={`${product.name} detail`}
                src={product.main_detail_src}
              />
            </div>
          )}
        </div>
      )}

      {/* Right column - top row (smaller when both exist, full height when alone) */}
      {product.detail_image_1_src && (
        <div className='relative h-full w-full'>
          <img
            className='absolute inset-0 h-full w-full rounded-md object-cover'
            alt={`${product.name} detail 1`}
            src={product.detail_image_1_src}
          />
        </div>
      )}

      {/* Right column - bottom row (only when both detail images exist) */}
      {product.detail_image_2_src && (
        <div className='relative h-full w-full'>
          <img
            className='absolute inset-0 h-full w-full rounded-md object-cover'
            alt={`${product.name} detail 2`}
            src={product.detail_image_2_src}
          />
        </div>
      )}
    </div>
  );
};
