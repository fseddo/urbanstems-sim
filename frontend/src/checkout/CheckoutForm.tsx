import { useState } from 'react';
import {
  AddressElement,
  PaymentElement,
  useStripe,
} from '@stripe/react-stripe-js';
import { tw } from '../common/utils/tw';
import { isEmail } from '../common/utils/isEmail';
import { useForm, FormErrors } from '../common/hooks/useForm';
import { useConfirmPayment } from './useConfirmPayment';

const formatCents = (cents: number | null) =>
  cents == null ? '—' : `$${(cents / 100).toFixed(2)}`;

type FormState = { email: string };

const validate = ({ email }: FormState): FormErrors<FormState> => {
  const errs: FormErrors<FormState> = {};
  if (!email.trim()) errs.email = 'Please provide your email.';
  else if (!isEmail(email)) errs.email = 'Please enter a valid email address.';
  return errs;
};

export const CheckoutForm = ({ totalCents }: { totalCents: number | null }) => {
  const stripe = useStripe();
  const form = useForm<FormState>({
    initialValues: { email: '' },
    validate,
  });
  // Stripe iframes mount at near-zero height and post final height ~50-200ms
  // later. Wrappers have min-heights so labels don't jump; the submit/footer
  // wait on both onReady fires so the user only sees a clickable button once
  // the form is ready.
  const [readyCount, setReadyCount] = useState(0);
  const formReady = readyCount === 2;
  const markReady = () => setReadyCount((c) => c + 1);

  const confirmPayment = useConfirmPayment();

  const onSubmit = form.submit(({ email }) => confirmPayment.mutate({ email }));

  return (
    <form onSubmit={onSubmit} noValidate className='flex flex-col gap-8'>
      <section className='flex flex-col gap-3'>
        <div className='flex items-center justify-between'>
          <h2 className='text-xl font-bold'>Contact</h2>
        </div>
        <form.Field
          name='email'
          className='gap-0.5'
          render={({ setValue, ...props }) => (
            <input
              {...props}
              type='email'
              placeholder='Email'
              // Match the Stripe iframes' radius/height
              className={tw(props.className, 'rounded-md py-3.5')}
            />
          )}
        />
      </section>

      <section className='flex flex-col gap-3'>
        <h2 className='text-xl font-bold'>Delivery</h2>
        <div className='min-h-[160px]'>
          <AddressElement
            options={{
              mode: 'shipping',
              allowedCountries: ['US'],
              fields: { phone: 'always' },
              validation: { phone: { required: 'auto' } },
            }}
            onReady={markReady}
          />
        </div>
      </section>

      <section className='flex flex-col gap-3'>
        <h2 className='text-xl font-bold'>Payment</h2>
        <div className='min-h-[190px]'>
          <PaymentElement
            options={{
              layout: 'tabs',
              wallets: { applePay: 'never', googlePay: 'never' },
            }}
            onReady={markReady}
          />
        </div>
      </section>

      <div
        className={tw(
          'flex flex-col gap-8 transition-opacity duration-200',
          formReady ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        {confirmPayment.error && (
          <p className='bg-error-bg text-error rounded-md px-4 py-3 text-sm'>
            {confirmPayment.error.message}
          </p>
        )}

        <div className='border-background-alt flex items-baseline justify-between border-t pt-4 lg:hidden'>
          <span className='text-base'>Total</span>
          <span className='text-2xl font-bold'>
            <span className='mr-2 text-xs opacity-60'>USD</span>
            {formatCents(totalCents)}
          </span>
        </div>

        <button
          type='submit'
          disabled={!stripe || confirmPayment.isPending}
          className='bg-brand-primary tracking-action mt-2 w-full rounded-md py-5 text-xs font-black text-white/90 transition-opacity duration-300 hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60'
        >
          {confirmPayment.isPending ? 'PROCESSING…' : 'PAY NOW'}
        </button>

        <p className='text-center text-[11px] opacity-60'>
          Your payment information is processed securely by Stripe. This is a
          sim — use test card 4242 4242 4242 4242 with any future expiry and any
          CVC.
        </p>
      </div>
    </form>
  );
};
