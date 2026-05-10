import { useRef, useState } from 'react';
import { useSetAtom } from 'jotai';
import { FiX } from 'react-icons/fi';
import { Link } from '@tanstack/react-router';
import { tw } from '../common/utils/tw';
import { useIsTouch } from '../common/hooks/useIsTouch';
import { useDismissable } from '../common/hooks/useDismissable';
import { usePortal } from '../common/hooks/usePortal';
import { useForm } from '../common/hooks/useForm';
import { isEmail } from '../common/utils/isEmail';
import { StarRatingInput } from '../common/components/StarRatingInput';
import { addLocalReviewAtom } from './reviewAtoms';

const FADE_DURATION_MS = 200;

type FormState = {
  rating: number;
  reviewText: string;
  headline: string;
  name: string;
  email: string;
};

const DEFAULT_STATE: FormState = {
  rating: 0,
  reviewText: '',
  headline: '',
  name: '',
  email: '',
};

type FormErrors = Partial<Record<keyof FormState, string>>;

// "Francesco Seddo" → "Francesco S.", "Francesco" → "Francesco".
// Anything past the second word is dropped — names with middle words get
// their second word treated as the surname for the initial.
const formatReviewerName = (name: string): string => {
  const [first, second] = name.trim().split(/\s+/);
  if (!first) return '';
  if (!second) return first;
  return `${first} ${second[0].toUpperCase()}.`;
};

const validate = (state: FormState): FormErrors => {
  const errs: FormErrors = {};
  if (state.rating === 0) errs.rating = 'A star rating is required';
  if (!state.reviewText.trim()) errs.reviewText = 'Review content is required';
  if (!state.headline.trim()) errs.headline = 'Review headline is required';
  if (!state.name.trim()) errs.name = 'A name is required';
  if (!state.email.trim() || !isEmail(state.email)) {
    errs.email = 'A valid email address is required';
  }
  return errs;
};

interface Props {
  open: boolean;
  onClose: () => void;
  productSlug: string;
}

// Fully simulated — no API call, no persistence. Two views: the form,
// and a "Thanks, {name}!" success card after submit. Stays mounted with
// opacity + `inert` toggling; reset is delayed until after fade-out so
// the user doesn't see the form clear mid-fade.
export const ReviewModal = ({ open, onClose, productSlug }: Props) => {
  const isTouch = useIsTouch();
  const contentRef = useRef<HTMLDivElement>(null);
  const addLocalReview = useSetAtom(addLocalReviewAtom);

  const [view, setView] = useState<'form' | 'success'>('form');
  const form = useForm<FormState>({
    initialValues: DEFAULT_STATE,
    validate,
  });

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setView('form');
      form.reset();
    }, FADE_DURATION_MS);
  };

  useDismissable(contentRef, open, handleClose);
  const renderPortal = usePortal(open);

  const onSubmit = form.submit((values) => {
    addLocalReview({
      id: crypto.randomUUID(),
      external_id: '',
      product_slug: productSlug,
      reviewer_name: formatReviewerName(values.name),
      is_verified_buyer: false,
      rating: values.rating,
      title: values.headline,
      body: values.reviewText,
      date: new Date().toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit',
      }),
    });
    setView('success');
  });

  return renderPortal(
    <div
      inert={!open}
      aria-hidden={!open}
      className={tw(
        'fixed inset-0 z-[100] transition-opacity duration-200',
        isTouch ? 'bg-white' : 'flex items-center justify-center bg-black/60',
        open ? 'opacity-100' : 'pointer-events-none opacity-0'
      )}
    >
      <div
        ref={contentRef}
        role='dialog'
        aria-modal='true'
        className={tw(
          'relative flex flex-col bg-white',
          isTouch
            ? 'h-full w-full overflow-y-auto'
            : 'mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-md shadow-2xl'
        )}
      >
        <button
          type='button'
          onClick={handleClose}
          aria-label='Close'
          className='text-foreground/60 hover:text-foreground absolute top-5 right-5 transition-colors'
        >
          <FiX size={24} />
        </button>

        {view === 'form' ? (
          <form
            onSubmit={onSubmit}
            noValidate
            className='flex flex-col gap-8 px-8 py-12'
          >
            <h2 className='font-crimson text-center text-3xl'>
              Share your thoughts
            </h2>

            <form.Field
              name='rating'
              label='Rate your experience'
              required
              render={({ value, setValue, ref }) => (
                <StarRatingInput
                  ref={ref}
                  value={value}
                  onChange={setValue}
                  size={32}
                />
              )}
            />

            <form.Field
              name='reviewText'
              label='Write a review'
              required
              render={({ setValue, ...props }) => (
                <textarea
                  {...props}
                  rows={5}
                  placeholder='Tell us what you like or dislike'
                />
              )}
            />

            <form.Field
              name='headline'
              label='Add a headline'
              required
              render={({ setValue, ...props }) => (
                <input
                  {...props}
                  type='text'
                  placeholder='Summarize your experience'
                />
              )}
            />

            <div className='grid gap-6 sm:grid-cols-2'>
              <form.Field
                name='name'
                label='Your name'
                required
                render={({ setValue, ...props }) => (
                  <input {...props} type='text' />
                )}
              />
              <form.Field
                name='email'
                label='Your email address'
                required
                render={({ setValue, ...props }) => (
                  <input {...props} type='email' />
                )}
              />
            </div>

            <button
              type='submit'
              className='bg-brand-primary tracking-action mt-2 self-end rounded-sm px-10 py-3.5 text-xs font-black text-white/90 transition-opacity hover:opacity-90 active:scale-[0.99]'
            >
              SEND
            </button>
          </form>
        ) : (
          <SuccessView name={form.values.name} onClose={handleClose} />
        )}
      </div>
    </div>
  );
};

const SuccessView = ({
  name,
  onClose,
}: {
  name: string;
  onClose: () => void;
}) => (
  <div className='flex flex-col items-center gap-6 px-8 py-20 text-center'>
    <h2 className='font-crimson text-4xl'>{`Thanks, ${name}!`}</h2>
    <p className='text-base opacity-80'>
      Your feedback helps other shoppers make better decisions.
    </p>
    <button
      onClick={onClose}
      className='bg-brand-primary tracking-action mt-2 rounded-sm px-8 py-3.5 text-xs font-black text-white/90 transition-opacity hover:opacity-90'
    >
      CONTINUE SHOPPING
    </button>
  </div>
);
