import { Columns1Icon } from '@/src/common/icons/Columns1Icon';
import { Columns2Icon } from '@/src/common/icons/Columns2Icon';
import { Columns3Icon } from '@/src/common/icons/Columns3Icon';
import { Columns4Icon } from '@/src/common/icons/Columns4Icon';
import type { ColumnCount } from '@/src/common/components/InfiniteList';
import { useIsDesktop } from '@/src/common/hooks/useIsDesktop';
import { useIsNarrow } from '@/src/common/hooks/useIsNarrow';
import { tw } from '@/src/common/utils/tw';
import { JSX } from 'react';

const DESKTOP_OPTIONS: ColumnCount[] = [2, 3, 4];
const MOBILE_OPTIONS: ColumnCount[] = [2, 1];
const NARROW_OPTIONS: ColumnCount[] = [1];

const ICON_BY_COUNT: Record<ColumnCount, () => JSX.Element> = {
  1: Columns1Icon,
  2: Columns2Icon,
  3: Columns3Icon,
  4: Columns4Icon,
};

type Props = {
  value: ColumnCount;
  onChange: (next: ColumnCount) => void;
};

export const ColumnChooser = ({ value, onChange }: Props) => {
  const isDesktop = useIsDesktop();
  const isNarrow = useIsNarrow();
  const options = isDesktop
    ? DESKTOP_OPTIONS
    : isNarrow
      ? NARROW_OPTIONS
      : MOBILE_OPTIONS;

  return (
    <div className='flex items-center gap-3'>
      {options.map((count) => {
        const active = count === value;
        const Icon = ICON_BY_COUNT[count];
        return (
          <button
            key={count}
            type='button'
            aria-label={`${count} column${count === 1 ? '' : 's'}`}
            aria-pressed={active}
            onClick={() => onChange(count)}
            className={tw(
              'text-foreground flex h-8 w-8 cursor-pointer items-center justify-center rounded-md transition-colors duration-400',
              active ? 'bg-foreground/8' : 'hover:bg-foreground/8'
            )}
          >
            <Icon />
          </button>
        );
      })}
    </div>
  );
};
