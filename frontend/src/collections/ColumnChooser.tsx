import { ColumnsIcon } from '@/src/common/icons/ColumnsIcon';
import type { ColumnCount } from '@/src/common/List';
import { useIsDesktop } from '@/src/common/useIsDesktop';
import { tw } from '@/src/common/utils/tw';

const DESKTOP_OPTIONS: ColumnCount[] = [2, 3, 4];
const MOBILE_OPTIONS: ColumnCount[] = [1, 2];

type Props = {
  value: ColumnCount;
  onChange: (next: ColumnCount) => void;
};

export const ColumnChooser = ({ value, onChange }: Props) => {
  const isDesktop = useIsDesktop();
  const options = isDesktop ? DESKTOP_OPTIONS : MOBILE_OPTIONS;

  return (
    <div className='flex items-center gap-1'>
      {options.map((count) => {
        const active = count === value;
        return (
          <button
            key={count}
            type='button'
            aria-label={`${count} column${count === 1 ? '' : 's'}`}
            aria-pressed={active}
            onClick={() => onChange(count)}
            className={tw(
              'flex h-8 w-8 cursor-pointer items-center justify-center rounded-sm transition-colors',
              active
                ? 'bg-foreground text-background'
                : 'text-foreground hover:bg-foreground/10'
            )}
          >
            <ColumnsIcon count={count} />
          </button>
        );
      })}
    </div>
  );
};
