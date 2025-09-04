import { apiClient } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface CategoryPageProps {
  params: {
    slug: string;
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  try {
    const [category, products] = await Promise.all([
      apiClient.getCategory(params.slug),
      apiClient.getCategoryProducts(params.slug),
    ]);

    return (
      <div className='min-h-screen bg-gray-50'>
        {/* Header */}
        <header className='border-b bg-white shadow-sm'>
          <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
            <div className='flex items-center justify-between py-6'>
              <div>
                <Link
                  href='/'
                  className='text-3xl font-bold text-gray-900 hover:text-gray-700'
                >
                  Urban Stems
                </Link>
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
          {/* Breadcrumb */}
          <nav className='mb-8 flex' aria-label='Breadcrumb'>
            <ol className='flex items-center space-x-4'>
              <li>
                <Link href='/' className='text-gray-500 hover:text-gray-700'>
                  Home
                </Link>
              </li>
              <li>
                <span className='text-gray-500'>/</span>
              </li>
              <li>
                <Link
                  href='/categories'
                  className='text-gray-500 hover:text-gray-700'
                >
                  Categories
                </Link>
              </li>
              <li>
                <span className='text-gray-500'>/</span>
              </li>
              <li className='font-medium text-gray-900'>{category.name}</li>
            </ol>
          </nav>

          {/* Category Header */}
          <div className='mb-8'>
            <h1 className='mb-2 text-3xl font-bold text-gray-900'>
              {category.name}
            </h1>
            <p className='text-gray-600'>
              Discover our beautiful selection of {category.name.toLowerCase()}
            </p>
          </div>

          {/* Products Grid */}
          {products.length > 0 ? (
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className='py-12 text-center'>
              <p className='text-lg text-gray-500'>
                No products found in the {category.name} category.
              </p>
              <p className='mt-2 text-sm text-gray-400'>
                Please check back later or browse other categories.
              </p>
              <Link
                href='/'
                className='mt-4 inline-block rounded-lg bg-black px-6 py-3 text-white transition-colors duration-200 hover:bg-gray-800'
              >
                Back to Home
              </Link>
            </div>
          )}
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
    console.error('Failed to load category:', error);
    notFound();
  }
}
