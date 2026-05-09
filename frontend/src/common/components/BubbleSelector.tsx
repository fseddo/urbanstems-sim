import { tw } from '../utils/tw';

type Props<T extends string | number> = {
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
  className?: string;
  // Per-bubble label for screen readers — receives the option and its
  // index. Default is `Option <n+1>`. Provide one when the options aren't
  // self-describing (e.g. an image-carousel selector).
  getAriaLabel?: (option: T, index: number) => string;
};

// Row of small clickable circles with one filled to indicate selection —
// the carousel-dot / page-indicator pattern. Generic over the option type
// so callers keep their narrowed unions (e.g. `'main' | 'hover'`) instead
// of widening to `string`. Constrained to `string | number` so the
// option doubles as the React key without an extra `getKey` prop.

export const BubbleSelector = <T extends string | number>({
  options,
  value,
  onChange,
  className,
  getAriaLabel,
}: Props<T>) => {
  return (
    <div className={tw('flex items-center gap-2', className)}>
      {options.map((option, i) => {
        const selected = option === value;
        return (
          <button
            key={option}
            type='button'
            onClick={() => onChange(option)}
            aria-label={getAriaLabel?.(option, i) ?? `Option ${i + 1}`}
            aria-pressed={selected}
            className={tw(
              'h-2 w-2 cursor-pointer rounded-full transition-colors',
              selected ? 'bg-foreground' : 'bg-foreground/30 hover:bg-foreground/50'
            )}
          />
        );
      })}
    </div>
  );
};
