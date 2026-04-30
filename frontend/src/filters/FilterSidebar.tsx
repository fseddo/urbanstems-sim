import { useEffect, useState } from 'react';
import { usePortal } from '../common/usePortal';
import { FiX, FiMinus, FiPlus } from 'react-icons/fi';
import { FilterOptions } from '@/api/products/FilterOptions';
import {
  CATEGORY_DISPLAY,
  COLOR_DISPLAY,
  FILTER_SPECS,
  SORT_OPTIONS,
  SortOption,
  STEM_TYPE_DISPLAY,
  UIFilters,
} from './filterSpecs';
import { tw } from '../common/utils/tw';

export type { UIFilters };

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  filters: UIFilters;
  onFiltersChange: (filters: UIFilters) => void;
  // Filter values present in the current scope (collection / category /
  // occasion / search). Drives which sections and chips the sidebar
  // surfaces — values with no matching products in scope are hidden.
  availableOptions: FilterOptions;
}

export function FilterSidebar({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  availableOptions,
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

  const toggleTag = <K extends 'categories' | 'stem_types' | 'colors'>(
    key: K,
    tag: string
  ) => {
    const current = (filters[key] as string[] | undefined) ?? [];
    const next = current.includes(tag)
      ? current.filter((c) => c !== tag)
      : [...current, tag];
    onFiltersChange({
      ...filters,
      [key]: next.length > 0 ? (next as UIFilters[K]) : undefined,
    });
  };

  // Price inputs use local draft state so typing doesn't rewrite the URL
  // on every keystroke; committed on blur or Enter.
  const [minDraft, setMinDraft] = useState(filters.min_price?.toString() ?? '');
  const [maxDraft, setMaxDraft] = useState(filters.max_price?.toString() ?? '');
  useEffect(() => {
    setMinDraft(filters.min_price?.toString() ?? '');
  }, [filters.min_price]);
  useEffect(() => {
    setMaxDraft(filters.max_price?.toString() ?? '');
  }, [filters.max_price]);

  const commitMinPrice = () => {
    const num = minDraft ? parseInt(minDraft) : undefined;
    if (num !== filters.min_price) {
      onFiltersChange({ ...filters, min_price: num });
    }
  };
  const commitMaxPrice = () => {
    const num = maxDraft ? parseInt(maxDraft) : undefined;
    if (num !== filters.max_price) {
      onFiltersChange({ ...filters, max_price: num });
    }
  };

  const appliedFilters = Object.values(FILTER_SPECS).flatMap((spec) =>
    spec.chips(filters, onFiltersChange)
  );

  return (
    <>
      {/* Backdrop overlay — portaled to body to escape stacking contexts */}
      {renderPortal(
        <div
          className={tw(
            'fixed inset-0 z-[51] bg-black/60 transition-opacity duration-300',
            isOpen
              ? 'pointer-events-auto opacity-100'
              : 'pointer-events-none opacity-0'
          )}
          onClick={onClose}
        />
      )}

      {/* Floating slide-in panel — above overlay, content-sized with max-height guard */}
      <div
        className={tw(
          'bg-background fixed top-[3vh] left-6 z-[52] h-[92vh] w-120 overflow-y-auto rounded-md p-6 shadow-2xl transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-[calc(100%+10rem)]'
        )}
      >
        {/* Header */}
        <div className='flex items-start justify-between'>
          <span className='font-crimson px-4 pt-7 pb-3 text-4xl'>
            Filter & Sort
          </span>
          <button
            onClick={onClose}
            className='border-brand-primary hover:bg-brand-primary rounded-full border p-1.5 transition-colors duration-400 hover:text-white'
            aria-label='Close filter panel'
          >
            <FiX size={18} />
          </button>
        </div>

        <div className='flex flex-col gap-4 px-4 py-8'>
          {/* Applied filters */}
          {appliedFilters.length > 0 && (
            <div className='flex flex-col gap-2'>
              <div className='text-sm font-bold'>Applied Filters</div>
              <div className='flex flex-wrap gap-2'>
                {appliedFilters.map((f) => (
                  <button
                    key={f.key}
                    onClick={f.onRemove}
                    className='font-mulish border-foreground/5 bg-background-alt/20 flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors duration-300 hover:bg-white/10'
                  >
                    {f.label}
                    <FiX size={12} />
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Sort */}
          <AccordionSection
            title={
              <>
                Sort By:{' '}
                <span className='font-normal'>
                  {currentSortOption.activeLabel ?? currentSortOption.label}
                </span>
              </>
            }
            isOpen={openSections.has('sort')}
            onToggle={() => toggleSection('sort')}
          >
            <div className='grid grid-cols-3 gap-2'>
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
          {/* Category — only show when the scope actually has multiple categories */}
          {availableOptions.categories.length > 1 && (
            <AccordionSection
              title='Category'
              isOpen={openSections.has('category')}
              onToggle={() => toggleSection('category')}
            >
              <div className='grid grid-cols-3 gap-2'>
                {availableOptions.categories.map((slug) => (
                  <FilterChip
                    key={slug}
                    label={CATEGORY_DISPLAY[slug]?.label ?? slug}
                    selected={(filters.categories ?? []).includes(slug)}
                    onClick={() => toggleTag('categories', slug)}
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
          >
            <div className='flex items-center gap-3'>
              <PriceInput
                label='From'
                placeholder='0'
                value={minDraft}
                onChange={setMinDraft}
                onCommit={commitMinPrice}
              />
              <PriceInput
                label='To'
                placeholder='Any'
                value={maxDraft}
                onChange={setMaxDraft}
                onCommit={commitMaxPrice}
              />
            </div>
          </AccordionSection>

          {/* Color */}
          {availableOptions.colors.length > 1 && (
            <AccordionSection
              title='Color'
              isOpen={openSections.has('colors')}
              onToggle={() => toggleSection('colors')}
            >
              <div className='grid grid-cols-3 gap-2'>
                {availableOptions.colors.map((slug) => {
                  const display = COLOR_DISPLAY[slug];
                  return (
                    <ColorChip
                      key={slug}
                      label={display?.label ?? slug}
                      hex={display?.hex ?? null}
                      selected={(filters.colors ?? []).includes(slug)}
                      onClick={() => toggleTag('colors', slug)}
                    />
                  );
                })}
              </div>
            </AccordionSection>
          )}

          {/* Stem Type */}
          {availableOptions.stem_types.length > 1 && (
            <AccordionSection
              title='Stem Type'
              isOpen={openSections.has('stem_types')}
              onToggle={() => toggleSection('stem_types')}
            >
              <div className='grid grid-cols-3 gap-2'>
                {availableOptions.stem_types.map((slug) => (
                  <FilterChip
                    key={slug}
                    label={STEM_TYPE_DISPLAY[slug]?.label ?? slug}
                    selected={(filters.stem_types ?? []).includes(slug)}
                    onClick={() => toggleTag('stem_types', slug)}
                  />
                ))}
              </div>
            </AccordionSection>
          )}
          {/* Vase Included — only show when scope contains at least one vase product */}
          {availableOptions.vase_included && (
            <AccordionSection
              title='Paired With Vase'
              isOpen={openSections.has('vase_included')}
              onToggle={() => toggleSection('vase_included')}
            >
              <div className='grid grid-cols-3 gap-2'>
                <FilterChip
                  label='Yes'
                  selected={filters.vase_included === true}
                  onClick={() =>
                    onFiltersChange({
                      ...filters,
                      vase_included: filters.vase_included ? undefined : true,
                    })
                  }
                />
              </div>
            </AccordionSection>
          )}
        </div>
      </div>
    </>
  );
}

function ColorChip({
  label,
  hex,
  selected,
  onClick,
}: {
  label: string;
  hex: string | null;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={tw(
        'font-mulish hover:border-brand-primary flex flex-col items-center gap-1 rounded-md border border-white bg-white py-1 text-center text-xs transition-colors hover:font-bold',
        selected && 'border-brand-primary text-brand-primary font-bold'
      )}
    >
      <span
        className='h-5 w-5 rounded-full border border-gray-200'
        style={
          hex
            ? { backgroundColor: hex }
            : {
                background:
                  'conic-gradient(#C97B8E, #E6C85A, #A3B58F, #6B85A3, #B39DBF, #C97B8E)',
              }
        }
      />
      {label}
    </button>
  );
}

function PriceInput({
  label,
  placeholder,
  value,
  onChange,
  onCommit,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onCommit: () => void;
}) {
  return (
    <div className='flex items-center gap-2'>
      <span className='text-brand-primary/80 text-sm'>$</span>
      <div className='rounded-md bg-white px-2 py-1'>
        <div className='font-mulish text-brand-primary/80 text-[8px] tracking-wider uppercase'>
          {label}
        </div>
        <input
          type='number'
          min='0'
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onCommit}
          onKeyDown={(e) => e.key === 'Enter' && onCommit()}
          className='font-mulish w-full bg-transparent text-xs focus:outline-none'
        />
      </div>
    </div>
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
      className={tw(
        'font-mulish hover:border-brand-primary hover:text-brand-primary rounded-sm border border-white bg-white py-4 text-center text-xs transition-all duration-200 hover:font-bold',
        selected && 'border-brand-primary text-brand-primary font-bold'
      )}
    >
      {label}
    </button>
  );
}

function AccordionSection({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className='border-background-alt border-b'>
      <button
        onClick={onToggle}
        className='flex w-full items-center justify-between py-4'
      >
        <span className='font-mulish flex items-center gap-2 text-sm font-bold'>
          {title}
        </span>
        {isOpen ? <FiMinus size={16} /> : <FiPlus size={16} />}
      </button>
      {isOpen && <div className='pb-4'>{children}</div>}
    </div>
  );
}
