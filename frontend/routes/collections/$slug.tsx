import { createFileRoute } from '@tanstack/react-router';
import { CalendarIcon } from '@/src/common/icons/CalendarIcon';
import { FilterIcon } from '@/src/common/icons/FilterIcon';
import { List } from '@/src/common/List';
import { productQueries } from '@/api/products/queries';
import { occasionQueries } from '@/api/occasions/queries';
import { JSX, ReactNode, useCallback } from 'react';
import type { Product } from '@/api/products/Product';
import { IconType } from 'react-icons';
import { SlLocationPin } from 'react-icons/sl';
import { ProductCard } from '@/src/common/ProductCard';
import { ProductFilters } from '@/api/products/ProductFilters';
import { categoryQueries } from '@/api/cateogries/categoryQueries';
import { collectionQueries } from '@/api/collections/collectionQueries';
import { type Category, CategoryType } from '@/api/cateogries/Category';
import type { Collection } from '@/api/collections/Collection';
import type { Occasion } from '@/api/occasions/Occasion';

export const Route = createFileRoute('/collections/$slug')({
  component: CollectionPage,
  loader: async ({ params, context }) => {
    // Fetch entity lists so we can determine slug type dynamically
    const [categories, collections, occasions] = await Promise.all([
      context.queryClient.ensureQueryData(categoryQueries.list()),
      context.queryClient.ensureQueryData(collectionQueries.list()),
      context.queryClient.ensureQueryData(occasionQueries.list()),
    ]);

    const slugType = getSlugType(params.slug, categories, collections, occasions);
    const filters = buildFilters(params.slug, slugType);

    const productsPromise = context.queryClient.ensureInfiniteQueryData(
      productQueries.infiniteList(filters)
    );

    if (slugType === 'all') {
      document.title = 'Shop Our Collection | UrbanStems';
      await productsPromise;
      return { slugType, filters, entity: null };
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

    const [, entity] = await Promise.all([productsPromise, entityPromise]);

    document.title =
      entity.page_title ??
      `${entity.name} Delivery | Next Day Delivery | UrbanStems`;

    return { slugType, filters, entity };
  },
});

type SlugType = 'all' | 'category' | 'collection' | 'occasion';

const getSlugType = (
  slug: string,
  categories: Category[],
  collections: Collection[],
  occasions: Occasion[],
): SlugType => {
  if (slug === 'all') return 'all';
  if (categories.some((c) => c.slug === slug)) return 'category';
  if (collections.some((c) => c.slug === slug)) return 'collection';
  if (occasions.some((o) => o.slug === slug)) return 'occasion';
  return 'occasion';
};

const buildFilters = (slug: string, slugType: SlugType): ProductFilters => {
  switch (slugType) {
    case 'all':
      return {};
    case 'category':
      return { category: slug as CategoryType };
    case 'collection':
      return { collection: slug };
    case 'occasion':
      return { occasion: slug };
  }
};

function CollectionPage() {
  const { filters, entity } = Route.useLoaderData();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const formattedDate = `${String(tomorrow.getMonth() + 1).padStart(2, '0')}/${String(tomorrow.getDate()).padStart(2, '0')}/${tomorrow.getFullYear()}`;

  return (
    <main>
      <header className='font-crimson flex flex-col items-center justify-center gap-2 py-18 text-[40px]'>
        <span className='flex flex-col items-center gap-4'>
          <span className='text-5xl'>{entity?.header_title}</span>
          <span className='font-mulish text-center text-base'>
            {entity?.header_subtitle}
          </span>
        </span>
      </header>
      <header className='flex flex-col border-y border-b-0 lg:flex-row lg:border-b'>
        <HeaderBarItem Icon={FilterIcon} className=''>
          Filter & Sort
        </HeaderBarItem>
        <HeaderBarItem Icon={CalendarIcon} className='flex-1'>
          <div>
            Delivery date: <span className='font-normal'>{formattedDate}</span>
          </div>
        </HeaderBarItem>
        <HeaderBarItem
          Icon={SlLocationPin}
          className='flex-3 border-r-0 lg:border-r-0'
        >
          Sending to: <span className='font-normal'>New York City, NY</span>
        </HeaderBarItem>
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
}: {
  children: ReactNode;
  className?: string;
  Icon?: IconType | (() => JSX.Element);
}) => {
  return (
    <div
      className={`flex items-center gap-3 border-b px-10 py-6 font-bold lg:border-r lg:border-b-0 ${className}`}
    >
      {Icon && <Icon />}
      {children}
    </div>
  );
};
