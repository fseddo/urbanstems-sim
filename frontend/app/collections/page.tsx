import { List } from '@/components/List';
import { ReactNode } from 'react';

export default function Collections() {
  return (
    <div>
      <main>
        <header className='font-crimson flex items-center justify-center gap-2 py-18 text-[40px]'>
          <span>
            <span className='italic'>Shop All </span>
            the flowers and gifts designed in-house with style and
            sophistication.
          </span>
        </header>
        <header className='flex border px-8'>
          <HeaderBarItem className=''>Filter & Sort</HeaderBarItem>
          <HeaderBarItem className='flex-1'>
            Delivery date: <span className='font-normal'>today</span>
          </HeaderBarItem>
          <HeaderBarItem className='flex-2'>
            Sending to: <span className='font-normal'>New York City, NY</span>
          </HeaderBarItem>
          <HeaderBarItem className='border-r-0'>{''}</HeaderBarItem>
        </header>
        <List />
      </main>
    </div>
  );
}

export const HeaderBarItem = (props: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div className={`border-r px-10 py-6 font-bold ${props.className}`}>
      {props.children}
    </div>
  );
};
