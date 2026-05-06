import {
  useLoaderData,
  useNavigate,
  useSearch,
} from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';
import type { Product } from '@/api/products/Product';
import { productQueries } from '@/api/products/productQueries';
import { List, type ColumnCount } from '@/src/common/List';
import { ProductCard } from '@/src/common/ProductCard';
import { useIsDesktop } from '@/src/common/useIsDesktop';
import { FilterSidebar } from '@/src/filters/FilterSidebar';
import { UIFilters } from '@/src/filters/filterSpecs';
import { CollectionHero } from './CollectionHero';
import { ListingHeaderBar } from './ListingHeaderBar';

export const CollectionPage = () => {
  const { filters, pageTag, filterOptions } = useLoaderData({
    from: '/collections/$slug',
  });
  const routeSearch = useSearch({ from: '/collections/$slug' });
  const navigate = useNavigate({ from: '/collections/$slug' });
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  const { search: searchTerm, ...uiFilters } = routeSearch;

  // Hide the page tag's own slug from its facet section in the sidebar —
  // toggling "Flowers" on /collections/flowers is a no-op for the user.
  const sidebarOptions = pageTag
    ? {
        ...filterOptions,
        facets: {
          ...filterOptions.facets,
          [pageTag.facet.slug]: (
            filterOptions.facets[pageTag.facet.slug] ?? []
          ).filter((s) => s !== pageTag.slug),
        },
      }
    : filterOptions;

  const setUiFilters = (next: UIFilters) => {
    navigate({
      search: (prev) => ({ ...prev, ...next }),
      replace: true,
    });
  };

  const isDesktop = useIsDesktop();
  const [columnCount, setColumnCount] = useState<ColumnCount>(() =>
    isDesktop ? 3 : 1
  );

  // When the breakpoint flips, snap the column count back to the new
  // viewport's default rather than carrying the prior preference into the new
  // range. Desktop default is 3, mobile default is 1.
  useEffect(() => {
    if (isDesktop && columnCount < 2) setColumnCount(3);
    if (!isDesktop && columnCount > 2) setColumnCount(1);
  }, [isDesktop, columnCount]);

  return (
    <main>
      <FilterSidebar
        isOpen={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
        filters={uiFilters}
        onFiltersChange={setUiFilters}
        availableOptions={sidebarOptions}
      />
      <CollectionHero pageTag={pageTag} searchTerm={searchTerm} />
      <ListingHeaderBar
        onOpenFilters={() => setFilterPanelOpen(true)}
        columnCount={columnCount}
        onColumnCountChange={setColumnCount}
      />
      <List
        queryOptions={productQueries.infiniteList(filters)}
        columnCount={columnCount}
        renderItem={(product) => (
          <ProductCard key={product.id} product={product} />
        )}
        getItemImageUrls={useCallback(
          (product: Product) =>
            [product.main_image, product.hover_image].filter(
              (url): url is string => url != null
            ),
          []
        )}
      />
    </main>
  );
};
