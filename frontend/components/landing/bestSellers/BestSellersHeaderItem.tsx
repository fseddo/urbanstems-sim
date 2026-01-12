import { capitalizeString } from '@/utils/capitalizeString';
import { Dispatch, SetStateAction } from 'react';

export const BestSellersHeaderItem = <T extends 'plants' | 'flowers'>(props: {
  item: T;
  selected: T;
  onClick: Dispatch<SetStateAction<'plants' | 'flowers'>>;
}) => {
  return (
    <div
      onClick={() => props.onClick(props.item)}
      className={`cursor-pointer ${props.selected === props.item ? 'text-foreground underline decoration-[2.5px] underline-offset-12' : 'text-foreground/40'}`}
    >
      {capitalizeString(props.item)}
    </div>
  );
};
