// Internal helper components for FilterSidebar. Tightly coupled to it (only
// consumer) but split out to keep the parent file scannable.
import { FiMinus, FiPlus } from 'react-icons/fi';
import { tw } from '../common/utils/tw';

export const ColorChip = ({
  label,
  hex,
  selected,
  onClick,
}: {
  label: string;
  hex: string | null;
  selected: boolean;
  onClick: () => void;
}) => {
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
};

export const PriceInput = ({
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
}) => {
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
};

export const FilterChip = ({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) => {
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
};

export const AccordionSection = ({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) => {
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
};

// Multi-select tag accordion: gates render on >1 option (a single option is
// always-on, no toggle worth showing), then maps the option slugs to chips
// via the caller-supplied renderChip. Generic on the slug type so callers
// keep their narrowed slug types (e.g. a 'flowers' | 'plants' literal union)
// instead of being widened to string. Used by Category / Color / Stem Type.
export const TagSection = <T extends string>(props: {
  title: string;
  options: readonly T[];
  selected: readonly T[];
  isOpen: boolean;
  onToggleSection: () => void;
  onToggleSlug: (slug: T) => void;
  renderChip: (
    slug: T,
    isSelected: boolean,
    onClick: () => void
  ) => React.ReactNode;
}) => {
  const {
    title,
    options,
    selected,
    isOpen,
    onToggleSection,
    onToggleSlug,
    renderChip,
  } = props;
  if (options.length <= 1) return null;
  return (
    <AccordionSection title={title} isOpen={isOpen} onToggle={onToggleSection}>
      <div className='grid grid-cols-3 gap-2'>
        {options.map((slug) =>
          renderChip(slug, selected.includes(slug), () => onToggleSlug(slug))
        )}
      </div>
    </AccordionSection>
  );
};
