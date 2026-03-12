'use client';

import { CalendarIcon } from '@/components/icons/CalendarIcon';
import { FilterIcon } from '@/components/icons/FilterIcon';
import { List } from '@/components/List';
import { ProductCard } from '@/components/ProductCard';
import { productQueries } from '@/lib/products/queries';
import { ProductFilters } from '@/types/api';
import { JSX, ReactNode, useMemo } from 'react';
import { IconType } from 'react-icons';
import { SlLocationPin } from 'react-icons/sl';
import { useParams } from 'next/navigation';

const CATEGORIES = ['flowers', 'plants', 'gifts', 'centerpieces'] as const;
type Category = (typeof CATEGORIES)[number];

const isCategory = (slug: string): slug is Category =>
  CATEGORIES.includes(slug as Category);

export default function CollectionPage() {
  const { slug } = useParams<{ slug: string }>();
  const isAll = slug === 'all';

  const filters: ProductFilters = useMemo(() => {
    if (isAll) return {};
    if (isCategory(slug)) return { category: slug };
    return { occasion: slug };
  }, [slug, isAll]);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const formattedDate = `${String(tomorrow.getMonth() + 1).padStart(2, '0')}/${String(tomorrow.getDate()).padStart(2, '0')}/${tomorrow.getFullYear()}`;

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
      <header className='flex flex-col border-y border-b-0 lg:flex-row lg:border-b-1'>
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
