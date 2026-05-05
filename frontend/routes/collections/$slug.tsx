import { createFileRoute } from '@tanstack/react-router';
import { useAtom } from 'jotai';
import { CalendarIcon } from '@/src/common/icons/CalendarIcon';
import { FilterIcon } from '@/src/common/icons/FilterIcon';
import { List } from '@/src/common/List';
import { deliveryDateAtom } from '@/src/date/deliveryDateAtom';
import { productQueries } from '@/api/products/queries';
import { occasionQueries } from '@/api/occasions/queries';
import { JSX, ReactNode, useCallback, useState } from 'react';
import type { Product } from '@/api/products/Product';
import { IconType } from 'react-icons';
import { SlLocationPin } from 'react-icons/sl';
import { ProductCard } from '@/src/common/ProductCard';
import { ProductFilters } from '@/api/products/ProductFilters';
import { FilterOptionsScope } from '@/api/products/FilterOptions';
import { categoryQueries } from '@/api/categories/categoryQueries';
import { collectionQueries } from '@/api/collections/collectionQueries';
import { type Category, CategoryType } from '@/api/categories/Category';
import type { Collection } from '@/api/collections/Collection';
import type { Occasion } from '@/api/occasions/Occasion';
import { FilterSidebar } from '@/src/filters/FilterSidebar';
import { parseUIFiltersSearch, UIFilters } from '@/src/filters/filterSpecs';
import { DatePicker } from '@/src/date/DatePicker';
import { AddressPicker } from '@/src/address/AddressPicker';
import { deliveryAddressAtom } from '@/src/address/deliveryAddressAtom';
import { tw } from '@/src/common/utils/tw';

type RouteSearch = UIFilters & { search?: string };

export const Route = createFileRoute('/collections/$slug')({
  validateSearch: (search: Record<string, unknown>): RouteSearch => ({
    ...parseUIFiltersSearch(search),
    search: typeof search.search === 'string' ? search.search : undefined,
  }),
  loaderDeps: ({ search }) => ({ search }),
  component: CollectionPage,
  loader: async ({ params, deps, context }) => {
    // Fetch entity lists so we can determine slug type dynamically
    const [categories, collections, occasions] = await Promise.all([
      context.queryClient.ensureQueryData(categoryQueries.list()),
      context.queryClient.ensureQueryData(collectionQueries.list()),
      context.queryClient.ensureQueryData(occasionQueries.list()),
    ]);

    const slugType = getSlugType(
      params.slug,
      categories,
      collections,
      occasions
    );
    const filters = buildFilters(params.slug, slugType, deps.search);
    const filterOptionsScope = buildFilterOptionsScope(
      params.slug,
      slugType,
      deps.search.search
    );

    const productsPromise = context.queryClient.ensureInfiniteQueryData(
      productQueries.infiniteList(filters)
    );
    const filterOptionsPromise = context.queryClient.ensureQueryData(
      productQueries.filterOptions(filterOptionsScope)
    );

    if (slugType === 'all') {
      document.title = 'Shop Our Collection | UrbanStems';
      await Promise.all([productsPromise, filterOptionsPromise]);
      const filterOptions = await filterOptionsPromise;
      return { slugType, filters, filterOptions, entity: null };
    }

    const entityPromise =
      slugType === 'category'
        ? context.queryClient.ensureQueryData(
            categoryQueries.detail(params.slug)
          )
        : slugType === 'collection'
          ? context.queryClient.ensureQueryData(
              collectionQueries.detail(params.slug)
            )
          : context.queryClient.ensureQueryData(
              occasionQueries.detail(params.slug)
            );

    const [, entity, filterOptions] = await Promise.all([
      productsPromise,
      entityPromise,
      filterOptionsPromise,
    ]);

    document.title =
      entity.page_title ??
      `${entity.name} Delivery | Next Day Delivery | UrbanStems`;

    return { slugType, filters, filterOptions, entity };
  },
});

type SlugType = 'all' | 'category' | 'collection' | 'occasion';

const getSlugType = (
  slug: string,
  categories: Category[],
  collections: Collection[],
  occasions: Occasion[]
): SlugType => {
  if (slug === 'all') return 'all';
  if (categories.some((c) => c.slug === slug)) return 'category';
  if (collections.some((c) => c.slug === slug)) return 'collection';
  if (occasions.some((o) => o.slug === slug)) return 'occasion';
  return 'occasion';
};

const buildFilterOptionsScope = (
  slug: string,
  slugType: SlugType,
  search: string | undefined
): FilterOptionsScope => {
  const base = search ? { search } : {};
  switch (slugType) {
    case 'all':
      return base;
    case 'category':
      return { ...base, category: slug };
    case 'collection':
      return { ...base, collection: slug };
    case 'occasion':
      return { ...base, occasion: slug };
  }
};

const buildFilters = (
  slug: string,
  slugType: SlugType,
  routeSearch: RouteSearch
): ProductFilters => {
  const { search: searchStr, ...uiFilters } = routeSearch;
  const base: ProductFilters = {
    ...uiFilters,
    ...(searchStr ? { search: searchStr } : {}),
  };
  switch (slugType) {
    case 'all':
      return base;
    case 'category':
      return { ...base, category: slug as CategoryType };
    case 'collection':
      return { ...base, collection: slug };
    case 'occasion':
      return { ...base, occasion: slug };
  }
};

function CollectionPage() {
  const { filters, entity, slugType, filterOptions } = Route.useLoaderData();
  const { slug } = Route.useParams();
  const routeSearch = Route.useSearch();
  const navigate = Route.useNavigate();
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  const { search: searchTerm, ...uiFilters } = routeSearch;

  // Hide the URL slug's own value from the sidebar — toggling "Flowers" on
  // /collections/flowers is a no-op for the user. Other dimensions are
  // unaffected (stem/color slugs don't overlap with category/collection
  // slugs).
  const sidebarOptions =
    slugType === 'category'
      ? {
          ...filterOptions,
          categories: filterOptions.categories.filter((c) => c !== slug),
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
          {slugType === 'all' ? (
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
              <span className='text-5xl'>{entity?.header_title}</span>
              <span className='font-mulish text-center text-base'>
                {entity?.header_subtitle}
              </span>
            </>
          )}
        </span>
      </header>
      <header className='flex flex-col border-y border-b-0 lg:flex-row lg:border-b'>
        <HeaderBarItem
          Icon={FilterIcon}
          className='cursor-pointer'
          onClick={() => setFilterPanelOpen(true)}
        >
          Filter & Sort
        </HeaderBarItem>
        <DatePicker
          className='flex flex-1'
          value={deliveryDate}
          onChange={setDeliveryDate}
          trigger={({ toggle, formatted }) => (
            <HeaderBarItem
              Icon={CalendarIcon}
              className='flex-1 cursor-pointer'
              onClick={toggle}
            >
              <div>
                Delivery date: <span className='font-normal'>{formatted}</span>
              </div>
            </HeaderBarItem>
          )}
        />
        <AddressPicker
          className='flex flex-3'
          value={deliveryAddress}
          onChange={setDeliveryAddress}
          trigger={({ toggle, value, formatted }) => (
            <HeaderBarItem
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
            </HeaderBarItem>
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
}

const HeaderBarItem = ({
  children,
  className,
  Icon,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  Icon?: IconType | (() => JSX.Element);
  onClick?: () => void;
}) => {
  return (
    <div
      className={tw(
        'flex items-center gap-3 border-b px-10 py-6 font-bold lg:border-r lg:border-b-0',
        className
      )}
      onClick={onClick}
    >
      {Icon && <Icon />}
      {children}
    </div>
  );
};
