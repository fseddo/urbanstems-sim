import { ReactNode, RefObject } from 'react';
import { CgSpinner } from 'react-icons/cg';
import { tw } from '../utils/tw';

// Vertical scrolling list with optional header + footer slots. Designed
// to be a flex item inside a flex-col parent — fills available vertical
// space (`flex-1`), scrolls overflowing items (`overflow-y-auto`), keeps
// header/footer pinned at the edges of the box.
//
// Items are passed in directly (caller fetches separately). For very
// large datasets that need windowing or pagination, use
// [`<InfiniteList>`](./InfiniteList.tsx) — which manages its own
// `useInfiniteQuery` and renders into a window-virtualized grid.

type Props<T> = {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  isLoading?: boolean;
  emptyState?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  scrollRef?: RefObject<HTMLDivElement | null>;
  // Tailwind gap class on the items wrapper. Default `'gap-3'`.
  itemGap?: string;
  // Extra classes on the scroll container — typically `px-*` and `pb-*`.
  scrollClassName?: string;
};

export const List = <T,>({
  items,
  getKey,
  renderItem,
  isLoading = false,
  emptyState,
  header,
  footer,
  scrollRef,
  itemGap = 'gap-3',
  scrollClassName,
}: Props<T>) => (
  <div className='flex min-h-0 flex-1 flex-col'>
    {header}
    <div
      ref={scrollRef}
      className={tw('min-h-0 flex-1 overflow-y-auto', scrollClassName)}
    >
      {isLoading ? (
        <div className='flex h-full items-center justify-center'>
          <CgSpinner className='animate-spin opacity-60' size={28} />
        </div>
      ) : items.length === 0 ? (
        emptyState
      ) : (
        <div className={tw('flex flex-col', itemGap)}>
          {items.map((item) => (
            <div key={getKey(item)}>{renderItem(item)}</div>
          ))}
        </div>
      )}
    </div>
    {footer}
  </div>
);
