import { Category, Product } from '@/types/api';
import Link from 'next/link';
import { ProductCardOld } from './ProductCardOld';

export const ListPage = ({
  products,
  categories,
}: {
  products?: Product[];
  categories?: Category[];
}) => {
  return (
    <>
      {/* Categories Section */}
      {(categories?.length ?? 0) > 0 && (
        <section className='mb-12'>
          <h2 className='mb-6 text-2xl font-bold'>Shop by Category</h2>
          <div className='flex flex-wrap gap-4'>
            {categories?.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className='rounded-lg border border-gray-200 px-4 py-2 transition-all duration-200 hover:border-gray-300 hover:shadow-md'
              >
                {category.name}
              </Link>
            ))}
          </div>
        </section>
      )}
      {/* Featured Products */}
      <section>
        <h2 className='mb-6 text-2xl font-bold'>Featured Products</h2>

        {(products?.length ?? 0) > 0 ? (
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {products?.slice(0, 12).map((product) => (
              <ProductCardOld key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className='py-12 text-center'>
            <p className='text-lg'>No products available at the moment.</p>
            <p className='mt-2 text-sm'>Please check back later.</p>
          </div>
        )}

        {(products?.length ?? 0) > 12 && (
          <div className='mt-8 text-center'>
            <Link
              href='/products'
              className='inline-block rounded-lg transition-colors duration-200'
            >
              View All Products
            </Link>
          </div>
        )}
      </section>
    </>
  );
};
