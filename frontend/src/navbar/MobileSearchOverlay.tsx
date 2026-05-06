import { useRef } from 'react';
import { useAtom } from 'jotai';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { productQueries } from '@/api/products/productQueries';
import { tagQueries } from '@/api/tags/tagQueries';
import { HorizontalScrollbar } from '../common/HorizontalScrollbar';
import { ProductCard } from '../common/ProductCard';
import { useDebounce } from '../common/useDebounce';
import { capitalizeString } from '../common/utils/capitalizeString';
import { NavLink } from './NavLink';
import { searchTermAtom, useNavbarPanel } from './navbarAtoms';

const TOP_SEARCHES = ['Roses', 'Peonies', 'Orchids'];

// Mobile-only search dropdown. Mirrors <SearchDropdown>'s positioning shape
// (`absolute top-full` hanging off the navbar) so the navbar's in-row search
// input stays as the input surface — only the panel content differs. Sections
// stack vertically and fill the rest of the viewport via
// `100dvh - var(--navbar-height)`. Articles & Blogs from the reference is
// omitted until real article content exists — placeholder links here would
// ship dead UI per the dynamic-sizing doc.

export const MobileSearchOverlay = () => {
  const [, setSearchOpen] = useNavbarPanel('search');
  const [searchTerm, setSearchTerm] = useAtom(searchTermAtom);
  const scrollRef = useRef<HTMLDivElement>(null);

  const close = () => setSearchOpen(false);
  const debouncedTerm = useDebounce(searchTerm, 300);
  const isEmpty = debouncedTerm.length === 0;

  const { data: searchProductData } = useQuery({
    ...productQueries.list({ search: debouncedTerm, size: 20 }),
    enabled: !isEmpty,
    placeholderData: keepPreviousData,
  });

  const { data: bestSellersData } = useQuery(
    productQueries.list({ category: ['flowers'], size: 8 })
  );

  // Backend handles name match + landing-kind restriction (any URL-routable
  // tag — Birthday in Occasion, Same-Day in Category, etc.). Variable is
  // `filteredTags` since the results aren't all Collections; section heading
  // stays "Collections" as the user-facing label.
  const { data: filteredTags = [] } = useQuery({
    ...tagQueries.search(debouncedTerm),
    enabled: !isEmpty,
    placeholderData: keepPreviousData,
  });

  const products = isEmpty
    ? (bestSellersData?.data ?? [])
    : (searchProductData?.data ?? bestSellersData?.data ?? []);
  const productTotal = isEmpty ? null : (searchProductData?.total ?? 0);

  return (
    <div
      className='font-mulish bg-background border-brand-primary absolute top-full left-0 w-full overflow-y-auto border-y'
      style={{ height: 'calc(100dvh - var(--navbar-height))' }}
    >
      <div className='flex flex-col gap-8 px-4 py-6'>
        <section className='flex flex-col gap-3'>
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
            <div className='flex flex-col gap-8'>
              <div
                ref={scrollRef}
                className='hide-scrollbar flex gap-4 overflow-x-auto'
              >
                {products.map((product) => (
                  <div
                    key={product.id}
                    className='w-[35%] min-w-[140px] shrink-0'
                    onClick={() => setTimeout(close, 80)}
                  >
                    <ProductCard product={product} compact />
                  </div>
                ))}
              </div>
              <HorizontalScrollbar
                targetRef={scrollRef}
                height='h-1.5'
                width='w-[60%]'
              />
            </div>
          ) : (
            !isEmpty && (
              <p className='text-brand-primary/50 text-sm'>No products found</p>
            )
          )}
        </section>

        {isEmpty ? (
          <section className='flex flex-col gap-3'>
            <h3 className='text-brand-primary text-sm font-bold'>
              Top Searches
            </h3>
            <div className='flex flex-wrap gap-2'>
              {TOP_SEARCHES.map((term) => (
                <button
                  key={term}
                  onClick={() => setSearchTerm(term)}
                  className='border-brand-primary/30 hover:border-brand-primary text-brand-primary rounded-sm border bg-white px-4 py-2 text-sm transition-colors'
                >
                  {term}
                </button>
              ))}
            </div>
          </section>
        ) : (
          <section className='flex flex-col gap-3'>
            <h3 className='text-brand-primary text-sm font-bold'>
              Collections
            </h3>
            {filteredTags.length > 0 ? (
              <div className='flex flex-wrap gap-2'>
                {filteredTags.map((tag) => (
                  <NavLink
                    key={tag.slug}
                    slug={tag.slug}
                    onClick={() => setTimeout(close, 80)}
                    className='font-mulish hover:border-brand-primary border-brand-primary/30 rounded-sm border bg-white px-4 py-2 text-sm hover:opacity-100'
                  >
                    {capitalizeString(tag.name)}
                  </NavLink>
                ))}
              </div>
            ) : (
              <p className='text-brand-primary/50 text-sm'>
                No collections found
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  );
};
