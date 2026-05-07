import { ReactNode } from 'react';
import { HorizontalScrollbar } from './HorizontalScrollbar';
import { tw } from './utils/tw';

export const HorizontalList = (props: {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div className='flex w-full flex-col gap-14'>
      <div
        className={tw(
          'hide-scrollbar flex gap-6 overflow-x-auto overflow-y-hidden pr-page',
          props.className
        )}
        ref={props.scrollRef}
      >
        {props.children}
      </div>
      <HorizontalScrollbar targetRef={props.scrollRef} />
    </div>
  );
};
