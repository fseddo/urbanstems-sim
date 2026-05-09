import { FilterIcon } from '@/src/common/icons/FilterIcon';
import { tw } from '@/src/common/utils/tw';
import { CollectionListHeaderCell } from '../CollectionListHeaderCell';

type Props = {
  count: number;
  onOpen: () => void;
  className?: string;
};

export const FilterCell = ({ count, onOpen, className }: Props) => {
  return (
    <CollectionListHeaderCell
      Icon={FilterIcon}
      className={className}
      onClick={onOpen}
    >
      Filter & Sort
      <div
        className={tw(
          'flex h-8 w-8 items-center justify-center',
          count > 0 && 'bg-background-alt/80 rounded-md text-xs font-medium'
        )}
      >
        {count > 0 && count}
      </div>
    </CollectionListHeaderCell>
  );
};
