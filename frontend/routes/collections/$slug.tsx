import { createFileRoute } from '@tanstack/react-router';
import { CalendarIcon } from '@/src/common/icons/CalendarIcon';
import { FilterIcon } from '@/src/common/icons/FilterIcon';
import { List } from '@/src/common/List';
import { productQueries } from '@/api/products/queries';
import { JSX, ReactNode, useCallback } from 'react';
import type { Product } from '@/api/products/Product';
import { IconType } from 'react-icons';
import { SlLocationPin } from 'react-icons/sl';
import { ProductCard } from '@/src/common/ProductCard';
import { ProductFilters } from '@/api/products/ProductFilters';

export const Route = createFileRoute('/collections/$slug')({
  component: CollectionPage,
  loader: ({ params, context }) => {
    const isAll = params.slug === 'all';

    if (isAll) {
      document.title = 'Shop Our Collection | UrbanStems';
    } else {
      const name = params.slug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      const singular = name.endsWith('s') ? name.slice(0, -1) : name;
      document.title = `${singular} Delivery | Next Day Delivery | UrbanStems`;
    }

    const filters: ProductFilters = isAll
      ? {}
      : isCategory(params.slug)
        ? { category: params.slug }
        : { occasion: params.slug };

    return context.queryClient.ensureInfiniteQueryData(
      productQueries.infiniteList(filters)
    );
  },
});

const CATEGORIES = ['flowers', 'plants', 'gifts', 'centerpieces'] as const;
type Category = (typeof CATEGORIES)[number];

const isCategory = (slug: string): slug is Category =>
  CATEGORIES.includes(slug as Category);

function CollectionPage() {
  const { slug } = Route.useParams();
  const isAll = slug === 'all';

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const formattedDate = `${String(tomorrow.getMonth() + 1).padStart(2, '0')}/${String(tomorrow.getDate()).padStart(2, '0')}/${tomorrow.getFullYear()}`;

  const filters: ProductFilters = isAll
    ? {}
    : isCategory(slug)
      ? { category: slug }
      : { occasion: slug };

  const displayName = isAll
    ? 'All'
    : slug
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

  return (
    <main>
      <header className='font-crimson flex items-center justify-center gap-2 py-18 text-[40px]'>
        <span>
          <span className='italic'>Shop {displayName} </span>
          flowers and gifts designed in-house with style and sophistication.
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
