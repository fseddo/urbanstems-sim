import { ReactNode } from 'react';
import HorizontalScrollbar from './HorizontalScrollbar';

export const HorizontalList = (props: {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  children: ReactNode;
}) => {
  return (
    <div className='flex w-full flex-col gap-14'>
      <div
        className='hide-scrollbar flex gap-6 overflow-x-auto overflow-y-hidden pr-20'
        ref={props.scrollRef}
      >
        {props.children}
      </div>
      <HorizontalScrollbar targetRef={props.scrollRef} />
    </div>
  );
};
