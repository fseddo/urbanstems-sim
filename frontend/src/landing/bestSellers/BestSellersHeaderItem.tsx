import { CategoryType } from '@/api/cateogries/Category';
import { capitalizeString } from '@/src/common/utils/capitalizeString';
import { Dispatch, SetStateAction } from 'react';

export const BestSellersHeaderItem = (props: {
  item: CategoryType;
  selected: CategoryType;
  onClick: Dispatch<SetStateAction<CategoryType>>;
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
