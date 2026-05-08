import { capitalizeString } from '@/src/common/utils/capitalizeString';
import { tw } from '@/src/common/utils/tw';
import { Dispatch, SetStateAction } from 'react';

// Generic over the slug type so callers' narrowed unions
// (e.g. 'flowers' | 'plants') flow through to onClick. Without the
// generic, a `Dispatch<SetStateAction<'flowers' | 'plants'>>` setter
// can't be passed to a wider `Dispatch<SetStateAction<string>>` param
// (state setters are contravariant).
export const BestSellersHeaderItem = <T extends string>(props: {
  item: T;
  selected: T;
  onClick: Dispatch<SetStateAction<T>>;
}) => {
  return (
    <div
      onClick={() => props.onClick(props.item)}
      className={tw(
        'cursor-pointer border-b-2 pb-2 -mb-px',
        'text-[14px] lg:text-[18px]',
        props.selected === props.item
          ? 'border-foreground'
          : 'border-transparent text-foreground/40'
      )}
    >
      {capitalizeString(props.item)}
    </div>
  );
};
