import { useEffect, useState } from 'react';
import { SlidePane } from '../common/SlidePane';
import { FiX } from 'react-icons/fi';
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
import {
  AccordionSection,
  ColorChip,
  FilterChip,
  PriceInput,
  TagSection,
} from './FilterSidebarParts';

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

export const FilterSidebar = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  availableOptions,
}: FilterSidebarProps) => {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

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

  // Keys of UIFilters whose value is a slug array. Derived so adding/removing
  // a tag-typed field on UIFilters automatically updates this constraint —
  // no second place to maintain.
  type TagFieldKey = {
    [K in keyof UIFilters]-?: NonNullable<UIFilters[K]> extends string[]
      ? K
      : never;
  }[keyof UIFilters];

  const toggleTag = <K extends TagFieldKey>(key: K, tag: string) => {
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
    <SlidePane isOpen={isOpen} onClose={onClose} side='left'>
      <div className='flex-1 overflow-y-auto p-6'>
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

          {/* Category */}
          <TagSection
            title='Category'
            options={availableOptions.facets.category ?? []}
            selected={filters.category ?? []}
            isOpen={openSections.has('category')}
            onToggleSection={() => toggleSection('category')}
            onToggleSlug={(slug) => toggleTag('category', slug)}
            renderChip={(slug, isSelected, onClick) => (
              <FilterChip
                key={slug}
                label={CATEGORY_DISPLAY[slug]?.label ?? slug}
                selected={isSelected}
                onClick={onClick}
              />
            )}
          />

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
          <TagSection
            title='Color'
            options={availableOptions.facets.color ?? []}
            selected={filters.color ?? []}
            isOpen={openSections.has('color')}
            onToggleSection={() => toggleSection('color')}
            onToggleSlug={(slug) => toggleTag('color', slug)}
            renderChip={(slug, isSelected, onClick) => {
              const display = COLOR_DISPLAY[slug];
              return (
                <ColorChip
                  key={slug}
                  label={display?.label ?? slug}
                  hex={display?.hex ?? null}
                  selected={isSelected}
                  onClick={onClick}
                />
              );
            }}
          />

          {/* Stem Type */}
          <TagSection
            title='Stem Type'
            options={availableOptions.facets.stem_type ?? []}
            selected={filters.stem_type ?? []}
            isOpen={openSections.has('stem_type')}
            onToggleSection={() => toggleSection('stem_type')}
            onToggleSlug={(slug) => toggleTag('stem_type', slug)}
            renderChip={(slug, isSelected, onClick) => (
              <FilterChip
                key={slug}
                label={STEM_TYPE_DISPLAY[slug]?.label ?? slug}
                selected={isSelected}
                onClick={onClick}
              />
            )}
          />

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
    </SlidePane>
  );
};
