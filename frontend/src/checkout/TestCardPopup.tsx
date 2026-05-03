import { useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';

const TEST_CARD = '4242 4242 4242 4242';

interface Props {
  onClose: () => void;
}

export const TestCardPopup = ({ onClose }: Props) => {
  const [copied, setCopied] = useState(false);

  // Esc-to-close + body-scroll lock are real side effects (global event +
  // DOM mutation), so they belong in an effect. Visibility itself is owned
  // by the parent via the onClose prop.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const copyCard = async () => {
    try {
      await navigator.clipboard.writeText(TEST_CARD.replaceAll(' ', ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can fail in non-secure contexts; harmless to ignore.
    }
  };

  return (
    <div
      className='fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4'
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className='font-mulish bg-brand-primary relative flex w-full max-w-lg flex-col gap-5 rounded-md p-8 text-white shadow-2xl'
        role='dialog'
        aria-modal='true'
        aria-labelledby='test-card-title'
      >
        <button
          onClick={onClose}
          className='absolute top-4 right-4 text-white/60 transition-colors hover:text-white'
          aria-label='Dismiss'
        >
          <FiX size={20} />
        </button>

        <div className='flex flex-col gap-2'>
          <p
            id='test-card-title'
            className='font-crimson text-3xl leading-tight'
          >
            This is a sim
          </p>
          <p className='text-sm text-white/80'>
            No flowers will be delivered. No real payment is processed.
          </p>
        </div>

        <div className='flex flex-col gap-2 rounded-sm bg-white/10 p-4 text-sm'>
          <p className='text-xs font-bold tracking-[0.18em] text-white/70 uppercase'>
            Use this test card
          </p>
          <div className='flex items-center justify-between gap-3'>
            <span className='font-mono text-base tracking-wider'>
              {TEST_CARD}
            </span>
            <button
              onClick={copyCard}
              className='rounded-sm border border-white/30 px-3 py-1 text-xs font-bold tracking-wider transition-colors hover:bg-white/10'
            >
              {copied ? 'COPIED' : 'COPY'}
            </button>
          </div>
          <p className='text-xs text-white/70'>
            Any future expiry, any 3-digit CVC, any ZIP.
          </p>
        </div>

        <button
          onClick={onClose}
          className='text-brand-primary mt-1 self-end rounded-sm bg-white px-6 py-3 text-xs font-black tracking-[0.2em] transition-opacity hover:opacity-90'
        >
          GOT IT
        </button>
      </div>
    </div>
  );
};
