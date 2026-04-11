import { useState } from 'react';

const STORAGE_KEY = 'disclaimer_dismissed';

export const DisclaimerPopup = () => {
  const [visible, setVisible] = useState(
    () => localStorage.getItem(STORAGE_KEY) !== 'true'
  );

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  };

  return (
    <div className='fixed bottom-6 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 px-4'>
      <div className='font-mulish bg-brand-primary flex flex-col gap-3 rounded-sm p-6 text-white shadow-xl'>
        <div className='flex items-start justify-between gap-4'>
          <p className='font-crimson text-lg'>Work in Progress</p>
          <button
            onClick={dismiss}
            className='mt-0.5 text-white/60 hover:text-white transition-colors'
            aria-label='Dismiss'
          >
            ✕
          </button>
        </div>
        <p className='text-sm text-white/80 leading-relaxed'>
          This is an actively developed project — some functionality is still missing and certain screen sizes are not fully supported. The site is updated weekly and these issues are being addressed.
        </p>
        <button
          onClick={dismiss}
          className='mt-1 self-end text-xs font-bold tracking-wider text-white/60 underline underline-offset-4 hover:text-white transition-colors'
        >
          GOT IT
        </button>
      </div>
    </div>
  );
};
