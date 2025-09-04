import { apiClient } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';
import Link from 'next/link';

export default async function Home() {
  try {
    // Fetch products and categories from your Django API
    const [productsResponse, categories] = await Promise.all([
      apiClient.getProducts({ ordering: '-created_at' }),
      apiClient.getCategories(),
    ]);

    const products = productsResponse.results;

    return (
      <div className='min-h-screen bg-gray-50'>
        {/* Header */}
        <header className='border-b bg-white shadow-sm'>
          <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
            <div className='flex items-center justify-between py-6'>
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>
                  Urban Stems
                </h1>
                <p className='text-gray-600'>
                  Beautiful flowers delivered fresh
                </p>
              </div>
              <nav className='flex space-x-8'>
                <Link
                  href='/products'
                  className='text-gray-700 hover:text-gray-900'
                >
                  All Products
                </Link>
                <Link
                  href='/categories'
                  className='text-gray-700 hover:text-gray-900'
                >
                  Categories
                </Link>
              </nav>
            </div>
          </div>
        </header>

        <main className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
          {/* Categories Section */}
          {categories.length > 0 && (
            <section className='mb-12'>
              <h2 className='mb-6 text-2xl font-bold text-gray-900'>
                Shop by Category
              </h2>
              <div className='flex flex-wrap gap-4'>
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/categories/${category.slug}`}
                    className='rounded-lg border border-gray-200 bg-white px-4 py-2 transition-all duration-200 hover:border-gray-300 hover:shadow-md'
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Featured Products */}
          <section>
            <h2 className='mb-6 text-2xl font-bold text-gray-900'>
              Featured Products
            </h2>

            {products.length > 0 ? (
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                {products.slice(0, 12).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className='py-12 text-center'>
                <p className='text-lg text-gray-500'>
                  No products available at the moment.
                </p>
                <p className='mt-2 text-sm text-gray-400'>
                  Please check back later.
                </p>
              </div>
            )}

            {products.length > 12 && (
              <div className='mt-8 text-center'>
                <Link
                  href='/products'
                  className='inline-block rounded-lg bg-black px-6 py-3 text-white transition-colors duration-200 hover:bg-gray-800'
                >
                  View All Products
                </Link>
              </div>
            )}
          </section>
        </main>

        {/* Footer */}
        <footer className='mt-16 border-t bg-white'>
          <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
            <div className='text-center text-gray-600'>
              <p>&copy; 2025 Urban Stems. Fresh flowers delivered daily.</p>
            </div>
          </div>
        </footer>
      </div>
    );
  } catch (error) {
    console.error('Failed to load homepage data:', error);

    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <h1 className='mb-4 text-2xl font-bold text-gray-900'>
            Unable to load products
          </h1>
          <p className='mb-4 text-gray-600'>
            Make sure the Django API is running at http://localhost:8000
          </p>
          <p className='text-sm text-gray-500'>
            Error: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }
}
