import {
  ComponentPropsWithoutRef,
  ElementType,
  ReactNode,
} from 'react';
import { tw } from '../utils/tw';

// Content panel that slides open/closed in response to an `open` boolean.
// Animates children between 0 and their natural height by transitioning
// `grid-template-rows: 0fr ↔ 1fr` on the wrapper; the inner `overflow-hidden`
// div clips during the transition. Works for any content height without
// measuring or hardcoding a max — the `1fr` row tracks content's natural
// height for free.
//
// Polymorphic via `as` — pick the outer semantic element (default `div`) and
// pass-through props are inferred from that element. `style` is reserved for
// the internal `transitionDuration`; reach for `className` for any wrapper
// styling. Default duration is 300ms.

type Props<T extends ElementType> = {
  open: boolean;
  as?: T;
  duration?: number;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className' | 'style'>;

export const CollapsiblePanel = <T extends ElementType = 'div'>({
  open,
  as,
  duration = 300,
  className,
  children,
  ...rest
}: Props<T>) => {
  const Component: ElementType = as ?? 'div';
  return (
    <Component
      {...rest}
      className={tw(
        'grid transition-[grid-template-rows] ease-out',
        open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      <div className='overflow-hidden'>{children}</div>
    </Component>
  );
};
