import { FormEvent, useState } from 'react';
import {
  AddressElement,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { tw } from '../common/utils/tw';

export const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Stripe iframes mount at near-zero height and only post their final height
  // back ~50–200ms later. Each iframe wrapper has a min-height roughly matching
  // its final size so the labels between them don't jump; the PAY NOW button
  // and footer below still wait for both onReady fires (counter === 2) so the
  // user only sees a clickable button once the form is actually ready.
  const [readyCount, setReadyCount] = useState(0);
  const formReady = readyCount === 2;
  const markReady = () => setReadyCount((c) => c + 1);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
        receipt_email: email || undefined,
      },
    });

    // confirmPayment redirects to return_url on success; we only get here if
    // there's an immediate error (validation, declined card, etc.).
    setError(stripeError?.message ?? 'Something went wrong. Please try again.');
    setSubmitting(false);
  };

  return (
    <form onSubmit={onSubmit} className='flex flex-col gap-8'>
      <section className='flex flex-col gap-3'>
        <div className='flex items-center justify-between'>
          <h2 className='text-xl font-bold'>Contact</h2>
        </div>
        <input
          type='email'
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder='Email'
          className='border-background-alt focus:border-brand-primary w-full rounded-md border bg-white px-4 py-3.5 text-sm outline-none transition-colors'
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
        <div className='min-h-[330px]'>
          <PaymentElement options={{ layout: 'tabs' }} onReady={markReady} />
        </div>
      </section>

      <div
        className={tw(
          'flex flex-col gap-8 transition-opacity duration-200',
          formReady ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        {error && (
          <p className='bg-error-bg text-error rounded-md px-4 py-3 text-sm'>
            {error}
          </p>
        )}

        <button
          type='submit'
          disabled={!stripe || submitting}
          className='bg-brand-primary mt-2 w-full rounded-md py-5 text-xs font-black tracking-[0.2em] text-white/90 transition-opacity duration-300 hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60'
        >
          {submitting ? 'PROCESSING…' : 'PAY NOW'}
        </button>

        <p className='text-center text-[11px] opacity-60'>
          Your payment information is processed securely by Stripe. This is a
          sim — use test card 4242 4242 4242 4242 with any future expiry and
          any CVC.
        </p>
      </div>
    </form>
  );
};
