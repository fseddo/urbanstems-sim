import { Link, useLoaderData } from '@tanstack/react-router';

export const CheckoutResultPage = () => {
  const result = useLoaderData({ from: '/checkout/result' });

  const formattedAmount =
    result.kind !== 'failed' && result.amount != null
      ? `$${(result.amount / 100).toFixed(2)}`
      : null;

  return (
    <div className='mx-auto flex min-h-[calc(100vh-var(--navbar-height))] max-w-xl flex-col items-center justify-center px-6 py-20 text-center'>
      {result.kind === 'succeeded' && (
        <>
          <h1 className='font-crimson mb-4 text-4xl'>Thank you!</h1>
          <p className='mb-2 text-base'>Your order is confirmed.</p>
          {formattedAmount && (
            <p className='mb-6 text-sm opacity-70'>
              We charged {formattedAmount} to your card. A receipt is on its
              way to your inbox.
            </p>
          )}
          <Link
            to='/'
            className='bg-brand-primary inline-block rounded-md px-10 py-4 text-xs font-black tracking-[0.2em] text-white/90 transition-opacity hover:opacity-90'
          >
            CONTINUE SHOPPING
          </Link>
        </>
      )}

      {result.kind === 'processing' && (
        <>
          <h1 className='font-crimson mb-4 text-4xl'>Almost there</h1>
          <p className='text-sm opacity-70'>
            Your payment is processing. We&apos;ll email you when it&apos;s
            confirmed.
          </p>
        </>
      )}

      {result.kind === 'failed' && (
        <>
          <h1 className='font-crimson mb-4 text-4xl'>
            Something went wrong
          </h1>
          <p className='mb-6 text-sm opacity-70'>
            Your payment didn&apos;t go through. Your cart is still saved —
            give it another try.
          </p>
          <Link
            to='/checkout'
            className='bg-brand-primary inline-block rounded-md px-10 py-4 text-xs font-black tracking-[0.2em] text-white/90'
          >
            BACK TO CHECKOUT
          </Link>
        </>
      )}
    </div>
  );
};
