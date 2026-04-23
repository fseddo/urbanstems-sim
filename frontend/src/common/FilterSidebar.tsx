import { CategoryType } from '@/api/cateogries/Category';
import { ProductSortKey } from '@/api/products/ProductFilters';
import { SortOrder } from '@/api/PaginatedResponse';
import { useState } from 'react';
import { usePortal } from './usePortal';
import { FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';

export type UIFilters = {
  sortKey?: ProductSortKey;
  sortOrder?: SortOrder;
  category?: CategoryType;
  min_price?: number;
  max_price?: number;
};

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  showCategoryFilter: boolean;
  filters: UIFilters;
  onFiltersChange: (filters: UIFilters) => void;
}

type SortOption = {
  label: string;
  sortKey?: ProductSortKey;
  sortOrder?: SortOrder;
};

const SORT_OPTIONS: SortOption[] = [
  { label: 'Recommended' },
  { label: 'Newest', sortKey: 'created_at', sortOrder: 'desc' },
  { label: 'Price: Low to High', sortKey: 'price', sortOrder: 'asc' },
  { label: 'Price: High to Low', sortKey: 'price', sortOrder: 'desc' },
  { label: 'Best Rated', sortKey: 'reviews_rating', sortOrder: 'desc' },
];

const CATEGORIES = [
  { label: 'All', value: undefined },
  { label: 'Flowers', value: CategoryType.Flowers },
  { label: 'Plants', value: CategoryType.Plants },
  { label: 'Gifts', value: CategoryType.Gifts },
  { label: 'Centerpieces', value: CategoryType.Centerpieces },
] as const;

export function FilterSidebar({
  isOpen,
  onClose,
  showCategoryFilter,
  filters,
  onFiltersChange,
}: FilterSidebarProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const renderPortal = usePortal(isOpen);

  const toggleSection = (section: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const currentSortOption =
    SORT_OPTIONS.find(
      (o) => o.sortKey === filters.sortKey && o.sortOrder === filters.sortOrder
    ) ?? SORT_OPTIONS[0];

  const handleSortChange = (option: SortOption) => {
    onFiltersChange({
      ...filters,
      sortKey: option.sortKey,
      sortOrder: option.sortOrder,
    });
  };

  const handleCategoryChange = (category: CategoryType | undefined) => {
    onFiltersChange({ ...filters, category });
  };

  const handleMinPriceChange = (value: string) => {
    const num = value ? parseInt(value) : undefined;
    onFiltersChange({ ...filters, min_price: num });
  };

  const handleMaxPriceChange = (value: string) => {
    const num = value ? parseInt(value) : undefined;
    onFiltersChange({ ...filters, max_price: num });
  };

  const hasActiveFilters = !!(
    filters.sortKey ||
    filters.category ||
    filters.min_price ||
    filters.max_price
  );

  const clearAll = () => onFiltersChange({});

  return (
    <>
      {/* Backdrop overlay — portaled to body to escape stacking contexts */}
      {renderPortal(
        <div
          className={`fixed inset-0 z-[51] bg-black/60 transition-opacity duration-300 ${
            isOpen
              ? 'pointer-events-auto opacity-100'
              : 'pointer-events-none opacity-0'
          }`}
          onClick={onClose}
        />
      )}

      {/* Floating slide-in panel — above overlay, content-sized with max-height guard */}
      <div
        className={`fixed top-[2vh] left-4 z-[52] h-[95vh] w-72 overflow-y-auto rounded-md bg-white shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-[calc(100%+1rem)]'
        }`}
      >
        {/* Header */}
        <div className='flex items-center justify-between border-b px-5 py-4'>
          <span className='font-mulish text-sm font-bold tracking-wide'>
            Filter & Sort
          </span>
          <button
            onClick={onClose}
            className='interactive-opacity p-1'
            aria-label='Close filter panel'
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Clear all */}
        {hasActiveFilters && (
          <div className='border-b px-5 py-2.5'>
            <button
              onClick={clearAll}
              className='font-mulish interactive-opacity text-xs underline'
            >
              Clear All
            </button>
          </div>
        )}

        {/* Sort */}
        <AccordionSection
          title='Sort'
          isOpen={openSections.has('sort')}
          onToggle={() => toggleSection('sort')}
          hasValue={!!filters.sortKey}
        >
          <div className='grid grid-cols-2 gap-2'>
            {SORT_OPTIONS.map((option) => (
              <FilterChip
                key={option.label}
                label={option.label}
                selected={currentSortOption.label === option.label}
                onClick={() => handleSortChange(option)}
              />
            ))}
          </div>
        </AccordionSection>

        {/* Category */}
        {showCategoryFilter && (
          <AccordionSection
            title='Category'
            isOpen={openSections.has('category')}
            onToggle={() => toggleSection('category')}
            hasValue={!!filters.category}
          >
            <div className='grid grid-cols-2 gap-2'>
              {CATEGORIES.map((cat) => (
                <FilterChip
                  key={cat.label}
                  label={cat.label}
                  selected={filters.category === cat.value}
                  onClick={() => handleCategoryChange(cat.value)}
                />
              ))}
            </div>
          </AccordionSection>
        )}

        {/* Price */}
        <AccordionSection
          title='Price'
          isOpen={openSections.has('price')}
          onToggle={() => toggleSection('price')}
          hasValue={!!(filters.min_price || filters.max_price)}
        >
          <div className='flex items-end gap-2'>
            <div className='flex-1'>
              <label className='font-mulish mb-1 block text-xs text-gray-400'>
                Min ($)
              </label>
              <input
                type='number'
                min='0'
                placeholder='0'
                value={filters.min_price ?? ''}
                onChange={(e) => handleMinPriceChange(e.target.value)}
                className='font-mulish w-full rounded-md border border-gray-200 px-3 py-2 text-xs focus:border-[#1e2934] focus:outline-none'
              />
            </div>
            <span className='mb-2.5 text-xs text-gray-300'>—</span>
            <div className='flex-1'>
              <label className='font-mulish mb-1 block text-xs text-gray-400'>
                Max ($)
              </label>
              <input
                type='number'
                min='0'
                placeholder='Any'
                value={filters.max_price ?? ''}
                onChange={(e) => handleMaxPriceChange(e.target.value)}
                className='font-mulish w-full rounded-md border border-gray-200 px-3 py-2 text-xs focus:border-[#1e2934] focus:outline-none'
              />
            </div>
          </div>
        </AccordionSection>
      </div>
    </>
  );
}

function FilterChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`font-mulish rounded-md border px-3 py-2 text-center text-xs transition-colors ${
        selected
          ? 'border-[#1e2934] font-bold text-[#1e2934]'
          : 'border-gray-200 text-gray-400 hover:border-[#1e2934] hover:font-bold hover:text-[#1e2934]'
      }`}
    >
      {label}
    </button>
  );
}

function AccordionSection({
  title,
  isOpen,
  onToggle,
  hasValue,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  hasValue: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className='border-b'>
      <button
        onClick={onToggle}
        className='interactive-opacity flex w-full items-center justify-between px-5 py-4'
      >
        <span className='font-mulish flex items-center gap-2 text-xs font-bold tracking-wider'>
          {title}
          {hasValue && (
            <span className='inline-block h-1.5 w-1.5 rounded-full bg-[#1e2934]' />
          )}
        </span>
        {isOpen ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
      </button>
      {isOpen && <div className='px-5 pb-4'>{children}</div>}
    </div>
  );
}
