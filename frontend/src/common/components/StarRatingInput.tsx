import { useState, Ref } from 'react';
import { tw } from '../utils/tw';

type Props = {
  value: number;
  onChange: (value: number) => void;
  size?: number;
  ref?: Ref<HTMLDivElement>;
  className?: string;
  ariaLabel?: string;
};

export const StarRatingInput = ({
  value,
  onChange,
  size = 28,
  ref,
  className,
  ariaLabel = 'Rating',
}: Props) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered ?? value;

  // Wrapper-level instead of per-star: per-star enter/leave flickers as
  // the mouse crosses gap pixels between stars.
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const star = Math.max(1, Math.min(5, Math.ceil(ratio * 5)));
    setHovered(star);
  };

  return (
    <div
      ref={ref}
      role='radiogroup'
      aria-label={ariaLabel}
      tabIndex={-1}
      onMouseMove={onMouseMove}
      onMouseLeave={() => setHovered(null)}
      className={tw('flex w-fit items-center gap-1', className)}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = display >= n;
        return (
          <button
            key={n}
            type='button'
            role='radio'
            aria-checked={value === n}
            onClick={() => onChange(n)}
            className='relative inline-block cursor-pointer hover:opacity-80'
            style={{ width: size, height: size }}
          >
            {/* Stacked SVGs cross-fade so empty→full isn't a hard swap. */}
            <img
              src='/empty_star.svg'
              alt=''
              width={size}
              height={size}
              className='absolute inset-0'
            />
            <img
              src='/full_star.svg'
              alt=''
              width={size}
              height={size}
              className={tw(
                'absolute inset-0 transition-opacity duration-50',
                filled ? 'opacity-100' : 'opacity-0'
              )}
            />
          </button>
        );
      })}
    </div>
  );
};
