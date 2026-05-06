import { useAtom } from 'jotai';
import {
  useLoaderData,
  useNavigate,
  useSearch,
} from '@tanstack/react-router';
import { useCallback, useState } from 'react';
import { SlLocationPin } from 'react-icons/sl';
import type { Product } from '@/api/products/Product';
import { productQueries } from '@/api/products/productQueries';
import { CalendarIcon } from '@/src/common/icons/CalendarIcon';
import { FilterIcon } from '@/src/common/icons/FilterIcon';
import { List } from '@/src/common/List';
import { ProductCard } from '@/src/common/ProductCard';
import { AddressPicker } from '@/src/address/AddressPicker';
import { deliveryAddressAtom } from '@/src/address/deliveryAddressAtom';
import { DatePicker } from '@/src/date/DatePicker';
import { deliveryDateAtom } from '@/src/date/deliveryDateAtom';
import { FilterSidebar } from '@/src/filters/FilterSidebar';
import { UIFilters } from '@/src/filters/filterSpecs';
import { ListingHeaderBarItem } from './ListingHeaderBarItem';

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

  const [deliveryDate, setDeliveryDate] = useAtom(deliveryDateAtom);
  const [deliveryAddress, setDeliveryAddress] = useAtom(deliveryAddressAtom);

  return (
    <main>
      <FilterSidebar
        isOpen={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
        filters={uiFilters}
        onFiltersChange={setUiFilters}
        availableOptions={sidebarOptions}
      />
      <header className='font-crimson flex flex-col items-center justify-center gap-2 py-18 text-[40px]'>
        <span className='flex flex-col items-center gap-4'>
          {!pageTag ? (
            searchTerm ? (
              <span className='text-5xl'>{`Results for "${searchTerm}"`}</span>
            ) : (
              <>
                <span className='text-5xl'>Shop All</span>
                <span className='font-mulish text-center text-base'>
                  The flowers and gifts designed in-house with style and
                  sophistication.
                </span>
              </>
            )
          ) : (
            <>
              <span className='text-5xl'>{pageTag.header_title}</span>
              <span className='font-mulish text-center text-base'>
                {pageTag.header_subtitle}
              </span>
            </>
          )}
        </span>
      </header>
      <header className='flex flex-col border-y border-b-0 lg:flex-row lg:border-b'>
        <ListingHeaderBarItem
          Icon={FilterIcon}
          className='cursor-pointer'
          onClick={() => setFilterPanelOpen(true)}
        >
          Filter & Sort
        </ListingHeaderBarItem>
        <DatePicker
          className='flex flex-1'
          value={deliveryDate}
          onChange={setDeliveryDate}
          trigger={({ toggle, formatted }) => (
            <ListingHeaderBarItem
              Icon={CalendarIcon}
              className='flex-1 cursor-pointer'
              onClick={toggle}
            >
              <div>
                Delivery date: <span className='font-normal'>{formatted}</span>
              </div>
            </ListingHeaderBarItem>
          )}
        />
        <AddressPicker
          className='flex flex-3'
          value={deliveryAddress}
          onChange={setDeliveryAddress}
          trigger={({ toggle, value, formatted }) => (
            <ListingHeaderBarItem
              Icon={SlLocationPin}
              className='flex-3 cursor-pointer border-r-0 lg:border-r-0'
              onClick={toggle}
            >
              <div>
                Sending to:{' '}
                <span className='font-normal'>
                  {value ? formatted : 'New York City, NY'}
                </span>
              </div>
            </ListingHeaderBarItem>
          )}
        />
      </header>
      <List
        queryOptions={productQueries.infiniteList(filters)}
        renderItem={(product) => (
          <ProductCard key={product.id} product={product} detailedView />
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
