import { ReactNode, useEffect, useRef, useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { CalendarIcon } from './icons/CalendarIcon';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAY_HEADERS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

export const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const formatDeliveryDate = (d: Date) => {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${m}/${dd}/${d.getFullYear()}`;
};

// Six-week grid (42 cells) starting on the Sunday on/before the 1st.
const buildMonthGrid = (year: number, month: number) => {
  const first = new Date(year, month, 1);
  const start = addDays(first, -first.getDay());
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
};

export interface DatePickerTriggerApi {
  open: boolean;
  toggle: () => void;
  value: Date;
  formatted: string;
  label: string;
}

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  // Inclusive earliest selectable day. Defaults to today.
  minDate?: Date;
  // Inclusive latest selectable day. Defaults to today + 30.
  maxDate?: Date;
  label?: string;
  className?: string;
  // Override the default trigger. The render-prop receives state + helpers
  // so the caller can render any element (e.g. a header bar item).
  trigger?: (api: DatePickerTriggerApi) => ReactNode;
}

export const DatePicker = ({
  value,
  onChange,
  minDate,
  maxDate,
  label = 'Delivery date',
  className,
  trigger,
}: DatePickerProps) => {
  const today = startOfDay(new Date());
  const min = startOfDay(minDate ?? today);
  const max = startOfDay(maxDate ?? addDays(today, 30));

  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => ({
    year: value.getFullYear(),
    month: value.getMonth(),
  }));

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // When opening, jump back to the month containing the selected value
  // so the user always lands on context for what they picked.
  const toggle = () => {
    setOpen((o) => {
      const next = !o;
      if (next) setView({ year: value.getFullYear(), month: value.getMonth() });
      return next;
    });
  };

  const grid = buildMonthGrid(view.year, view.month);

  const goPrev = () =>
    setView(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
    );
  const goNext = () =>
    setView(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
    );

  const firstOfView = startOfDay(new Date(view.year, view.month, 1));
  const lastOfView = startOfDay(new Date(view.year, view.month + 1, 0));
  const canGoPrev = firstOfView > min;
  const canGoNext = lastOfView < max;

  const select = (day: Date) => {
    onChange(day);
    setOpen(false);
  };

  const formatted = formatDeliveryDate(value);

  return (
    <div
      ref={containerRef}
      className={`relative ${className ?? 'inline-block'}`}
    >
      {trigger ? (
        trigger({ open, toggle, value, formatted, label })
      ) : (
        <button
          type='button'
          onClick={toggle}
          className='border-brand-primary text-brand-primary flex items-center gap-3 border bg-white px-6 py-5 font-bold transition-colors hover:bg-white/60'
        >
          <CalendarIcon />
          <span>
            {label}: <span className='font-normal'>{formatted}</span>
          </span>
        </button>
      )}

      {open && (
        <div className='absolute top-full left-4 z-30 mt-3 w-80 bg-white shadow-md'>
          {/* caret */}
          <div className='border-background-alt absolute -top-2 left-6 h-4 w-4 rotate-45 border-t border-l bg-white' />

          {/* header */}
          <div className='flex items-center px-4 py-3'>
            <button
              type='button'
              onClick={goPrev}
              disabled={!canGoPrev}
              aria-label='Previous month'
              className='disabled:cursor-default disabled:opacity-30'
            >
              <FiChevronLeft size={20} />
            </button>
            <div className='font-crimson flex-1 text-center text-lg'>
              <span>{MONTH_NAMES[view.month]},</span>{' '}
              <span className='opacity-50'>{view.year}</span>
            </div>
            <button
              type='button'
              onClick={goNext}
              disabled={!canGoNext}
              aria-label='Next month'
              className='disabled:cursor-default disabled:opacity-30'
            >
              <FiChevronRight size={20} />
            </button>
          </div>

          {/* day-of-week headers */}
          <div className='grid grid-cols-7 px-3 pb-1'>
            {DAY_HEADERS.map((d) => (
              <div
                key={d}
                className='font-mulish text-center text-xs font-bold opacity-50'
              >
                {d}
              </div>
            ))}
          </div>

          {/* day grid */}
          <div className='grid grid-cols-7 gap-y-1 px-3 pb-4'>
            {grid.map((day) => {
              const inMonth = day.getMonth() === view.month;
              const inRange = day >= min && day <= max;
              const selected = isSameDay(day, value);
              const isToday = isSameDay(day, today);
              const disabled = !inRange;

              return (
                <button
                  key={day.toISOString()}
                  type='button'
                  disabled={disabled}
                  onClick={() => select(day)}
                  aria-label={day.toDateString()}
                  aria-pressed={selected}
                  className={[
                    'font-crimson rounded-full py-2 text-center text-lg transition-colors',
                    disabled
                      ? 'cursor-default opacity-30'
                      : 'hover:bg-background-alt/40 cursor-pointer',
                    !inMonth && !disabled && 'opacity-60',
                    isToday && !selected && 'font-bold',
                    selected && 'bg-brand-primary text-white',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
