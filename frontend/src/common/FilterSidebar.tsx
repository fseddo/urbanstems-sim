import { useEffect, useState } from 'react';
import { usePortal } from './usePortal';
import {
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiMinus,
  FiPlus,
} from 'react-icons/fi';
import {
  CATEGORIES,
  COLORS,
  FILTER_SPECS,
  SORT_OPTIONS,
  SortOption,
  STEM_TYPES,
  UIFilters,
} from './filterSpecs';

export type { UIFilters };

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  showCategoryFilter: boolean;
  filters: UIFilters;
  onFiltersChange: (filters: UIFilters) => void;
}

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
        className={`bg-background fixed top-[3vh] left-6 z-[52] h-[92vh] w-120 overflow-y-auto rounded-md p-6 shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-[calc(100%+10rem)]'
        }`}
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
          {/* Category */}
          {showCategoryFilter && (
            <AccordionSection
              title='Category'
              isOpen={openSections.has('category')}
              onToggle={() => toggleSection('category')}
            >
              <div className='grid grid-cols-3 gap-2'>
                {CATEGORIES.map((cat) => (
                  <FilterChip
                    key={cat.label}
                    label={cat.label}
                    selected={(filters.categories ?? []).includes(cat.value)}
                    onClick={() => toggleTag('categories', cat.value)}
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
          <AccordionSection
            title='Color'
            isOpen={openSections.has('colors')}
            onToggle={() => toggleSection('colors')}
          >
            <div className='grid grid-cols-3 gap-2'>
              {COLORS.map((color) => (
                <ColorChip
                  key={color.value}
                  label={color.label}
                  hex={color.hex}
                  selected={(filters.colors ?? []).includes(color.value)}
                  onClick={() => toggleTag('colors', color.value)}
                />
              ))}
            </div>
          </AccordionSection>

          {/* Stem Type */}
          <AccordionSection
            title='Stem Type'
            isOpen={openSections.has('stem_types')}
            onToggle={() => toggleSection('stem_types')}
          >
            <div className='grid grid-cols-3 gap-2'>
              {STEM_TYPES.map((stem) => (
                <FilterChip
                  key={stem.value}
                  label={stem.label}
                  selected={(filters.stem_types ?? []).includes(stem.value)}
                  onClick={() => toggleTag('stem_types', stem.value)}
                />
              ))}
            </div>
          </AccordionSection>
          {/* Vase Included */}
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
      className={`font-mulish flex flex-col items-center gap-2 rounded-md bg-white py-3 text-center text-xs transition-colors ${
        selected && 'border border-[#1e2934] font-bold text-[#1e2934]'
      }`}
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
    <div className='flex flex-1 items-center gap-2'>
      <span className='text-gray-400'>$</span>
      <div className='flex-1 rounded-md bg-white px-3 py-2'>
        <div className='font-mulish text-[10px] tracking-wider text-gray-400 uppercase'>
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
          className='font-mulish w-full bg-transparent text-sm focus:outline-none'
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
      className={`font-mulish duraction-200 hover:border-brand-primary hover:text-brand-primary rounded-md border bg-white py-4 text-center text-xs transition-all hover:font-bold ${
        selected
          ? 'border-brand-primary text-brand-primary font-bold'
          : 'border-transparent'
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
