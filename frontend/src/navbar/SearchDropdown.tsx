import { useRef } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { collectionQueries } from '@/api/collections/collectionQueries';
import { productQueries } from '@/api/products/queries';
import { useSearchDropdown } from './NavbarContext';
import { NavLink } from './NavLink';
import { ProductCard } from '../common/ProductCard';
import { HorizontalScrollbar } from '../common/HorizontalScrollbar';
import { Link } from '@tanstack/react-router';
import { CategoryType } from '@/api/categories/Category';

const TOP_SEARCHES = ['Roses', 'Peonies', 'Orchids'];

export const SearchDropdown = () => {
  const { setSearchOpen, searchTerm, setSearchTerm, setSearchInputRef } = useSearchDropdown();
  const scrollRef = useRef<HTMLDivElement>(null);

  const close = () => setSearchOpen(false);

  const isEmpty = searchTerm.length === 0;

  const { data: collections = [] } = useQuery(collectionQueries.list());

  const { data: searchProductData } = useQuery({
    ...productQueries.list({ search: searchTerm, size: 20 }),
    enabled: !isEmpty,
    placeholderData: keepPreviousData,
  });

  const { data: bestSellersData } = useQuery(
    productQueries.list({
      category: CategoryType.Flowers,
      size: 8,
    })
  );

  const filteredCollections = isEmpty
    ? []
    : collections.filter((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

  const products = isEmpty
    ? (bestSellersData?.data ?? [])
    : (searchProductData?.data ?? bestSellersData?.data ?? []);
  const productTotal = isEmpty ? null : (searchProductData?.total ?? 0);

  return (
    <div className='font-mulish border-brand-primary absolute top-full left-0 w-full border-y bg-[#f5f5f3] shadow-md'>
      <div className='flex px-40 py-8'>
        {/* Left column */}
        <div className='w-64 shrink-0 pr-8'>
          {isEmpty ? (
            <>
              <h3 className='text-brand-primary mb-3 text-sm font-bold'>
                Top Searches
              </h3>
              <div className='flex flex-wrap gap-2'>
                {TOP_SEARCHES.map((term) => (
                  <button
                    key={term}
                    onClick={() => { setSearchInputRef.current(term); setSearchTerm(term); }}
                    className='border-brand-primary/30 hover:border-brand-primary text-brand-primary rounded-sm border bg-white px-3 py-1.5 text-sm transition-colors'
                  >
                    {term}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <h3 className='text-brand-primary mb-4 text-sm font-bold'>
                Collections
              </h3>
              {filteredCollections.length > 0 ? (
                <div className='flex flex-wrap gap-2'>
                  {filteredCollections.map((col) => (
                    <NavLink
                      key={col.slug}
                      slug={col.slug}
                      onClick={() => setTimeout(close, 80)}
                      className='font-mulish hover:border-brand-primary border-brand-primary/30 rounded-sm border bg-white px-3 py-2 text-sm hover:opacity-100'
                    >
                      {col.name}
                    </NavLink>
                  ))}
                </div>
              ) : (
                <p className='text-brand-primary/50 text-sm'>
                  No collections found
                </p>
              )}
            </>
          )}
        </div>

        {/* Divider */}
        <div className='border-brand-primary/20 mr-8 border-l' />

        {/* Right: Products */}
        <div className='flex min-w-0 flex-1 flex-col gap-4'>
          <div className='flex items-center justify-between'>
            <h3 className='text-brand-primary text-sm font-bold'>
              {isEmpty
                ? 'Best Sellers'
                : `Products${productTotal != null && productTotal > 0 ? ` (${productTotal} Results)` : ''}`}
            </h3>
            {!isEmpty && products.length > 0 && (
              <Link
                to='/collections/$slug'
                params={{ slug: 'all' }}
                search={{ search: searchTerm }}
                onClick={() => setTimeout(close, 80)}
                className='text-brand-primary text-xs font-bold tracking-wider underline underline-offset-4 hover:opacity-60'
              >
                VIEW ALL
              </Link>
            )}
          </div>

          {products.length > 0 ? (
            <div className='flex flex-col gap-4'>
              <div
                ref={scrollRef}
                className='hide-scrollbar flex gap-5 overflow-x-auto'
              >
                {products.map((product) => (
                  <div
                    key={product.id}
                    className='w-[calc(25%-15px)] min-w-[160px] shrink-0'
                    onClick={() => setTimeout(close, 80)}
                  >
                    <ProductCard product={product} compact />
                  </div>
                ))}
              </div>
              <HorizontalScrollbar targetRef={scrollRef} />
            </div>
          ) : (
            !isEmpty && (
              <p className='text-brand-primary/50 text-sm'>No products found</p>
            )
          )}
        </div>
      </div>
    </div>
  );
};
