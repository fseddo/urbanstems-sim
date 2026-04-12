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
          <p className='text-lg'>This is an actively developed project</p>
          <button
            onClick={dismiss}
            className='mt-0.5 text-white/60 transition-colors hover:text-white'
            aria-label='Dismiss'
          >
            ✕
          </button>
        </div>
        <div className='flex flex-col gap-2 text-sm leading-relaxed text-white/80'>
          <p>
            Some functionality is still missing and certain screen sizes are not
            fully supported.
          </p>
          <p>
            The site is updated weekly, but if you have any feedback or want to
            report an issue, feel free to reach out to me on{' '}
            <a
              href='https://www.linkedin.com/in/francesco-seddo/'
              target='_blank'
              rel='noreferrer'
              className='underline hover:text-white'
            >
              LinkedIn
            </a>
          </p>
          <p>Thanks!</p>
        </div>
        <button
          onClick={dismiss}
          className='mt-1 self-end text-xs font-bold tracking-wider text-white/60 underline underline-offset-4 transition-colors hover:text-white'
        >
          GOT IT
        </button>
      </div>
    </div>
  );
};
