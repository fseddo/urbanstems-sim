import type { ColumnCount } from '@/src/common/List';
import { ColumnChooser } from '../ColumnChooser';
import { CollectionListHeaderCell } from '../CollectionListHeaderCell';

type Props = {
  value: ColumnCount;
  onChange: (next: ColumnCount) => void;
  className?: string;
};

export const ColumnChooserCell = ({ value, onChange, className }: Props) => {
  return (
    <CollectionListHeaderCell className={className}>
      <ColumnChooser value={value} onChange={onChange} />
    </CollectionListHeaderCell>
  );
};
