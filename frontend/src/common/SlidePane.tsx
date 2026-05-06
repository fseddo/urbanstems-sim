import { ReactNode } from 'react';
import { usePortal } from './usePortal';
import { tw } from './utils/tw';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  side: 'left' | 'right';
  children: ReactNode;
};

// Responsive sliding pane shell. Three viewport states with smooth
// transitions on every property (positions and width stay numeric so the
// breakpoint flip animates instead of snapping):
//   - < 530px: full screen, no rounding.
//   - 530-1019px: wall-attached, full height, 480px wide, no rounding.
//   - ≥ 1020px: floating popover with 3vh / 5vh / 24px margins + rounded.
//
// Shell-only: provides the portaled backdrop, the animated container, and
// `flex flex-col` so children can stack. Consumers compose their own
// header / scrolling body / footer (or a single scrolling panel — whatever
// the use case wants). The portal is used for the backdrop only because
// `usePortal` also locks body scroll while open.

export const SlidePane = ({ isOpen, onClose, side, children }: Props) => {
  const renderPortal = usePortal(isOpen);
  const isLeft = side === 'left';

  return (
    <>
      {renderPortal(
        <div
          className={tw(
            'fixed inset-0 z-[51] bg-black/60 transition-opacity duration-300',
            isOpen
              ? 'pointer-events-auto opacity-100'
              : 'pointer-events-none opacity-0'
          )}
          onClick={onClose}
        />
      )}

      <div
        className={tw(
          'bg-background fixed z-[52] flex flex-col shadow-2xl transition-all duration-300',
          'top-0 bottom-0',
          isLeft ? 'left-0' : 'right-0',
          'w-screen min-[530px]:w-[480px]',
          'min-[1020px]:top-[3vh] min-[1020px]:bottom-[5vh] min-[1020px]:rounded-md',
          isLeft ? 'min-[1020px]:left-6' : 'min-[1020px]:right-6',
          isOpen
            ? 'translate-x-0'
            : isLeft
              ? '-translate-x-[calc(100%+10rem)]'
              : 'translate-x-[calc(100%+10rem)]'
        )}
      >
        {children}
      </div>
    </>
  );
};
