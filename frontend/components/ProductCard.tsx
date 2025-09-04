import { Product } from '@/types/api';
import Image from 'next/image';
import Link from 'next/link';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const formatPrice = (cents: number | null): string => {
    if (!cents) return 'Price not available';
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className='overflow-hidden rounded-lg bg-white shadow-md transition-shadow duration-300 hover:shadow-lg'>
      {/* Product Image */}
      <div className='relative h-64 w-full'>
        {product.main_image ? (
          <Image
            src={product.main_image}
            alt={product.name}
            fill
            className='object-cover'
            sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
          />
        ) : (
          <div className='flex h-full w-full items-center justify-center bg-gray-200'>
            <span className='text-gray-500'>No image available</span>
          </div>
        )}

        {/* Badge */}
        {product.badge_text && (
          <div className='absolute top-2 left-2 rounded bg-red-500 px-2 py-1 text-xs font-bold text-white'>
            {product.badge_text}
          </div>
        )}

        {/* Variant Type */}
        {product.variant_type && (
          <div className='absolute top-2 right-2 rounded bg-black px-2 py-1 text-xs text-white'>
            {product.variant_type.charAt(0).toUpperCase() +
              product.variant_type.slice(1)}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className='p-4'>
        <h3 className='mb-2 line-clamp-2 text-lg font-semibold text-gray-900'>
          {product.name}
        </h3>

        {/* Price */}
        <div className='mb-2 flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            {product.discounted_price ? (
              <>
                <span className='text-lg font-bold text-red-600'>
                  {formatPrice(product.discounted_price)}
                </span>
                <span className='text-sm text-gray-500 line-through'>
                  {formatPrice(product.price)}
                </span>
              </>
            ) : (
              <span className='text-lg font-bold text-gray-900'>
                {formatPrice(product.price)}
              </span>
            )}
          </div>
        </div>

        {/* Reviews */}
        {product.reviews_rating && product.reviews_count && (
          <div className='mb-3 flex items-center'>
            <div className='flex items-center'>
              <span className='text-sm text-yellow-400'>★</span>
              <span className='ml-1 text-sm text-gray-600'>
                {product.reviews_rating} ({product.reviews_count} reviews)
              </span>
            </div>
          </div>
        )}

        {/* Stock Status */}
        <div className='flex items-center justify-between'>
          <span
            className={`text-sm font-medium ${
              product.stock > 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </span>

          {/* Delivery Time */}
          {product.delivery_lead_time && (
            <span className='text-sm text-gray-500'>
              {product.delivery_lead_time} day delivery
            </span>
          )}
        </div>

        {/* View Product Button */}
        <Link
          href={`/products/${product.id}`}
          className='mt-4 block w-full rounded bg-black px-4 py-2 text-center text-white transition-colors duration-200 hover:bg-gray-800'
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
