import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { HiOutlineChevronDown } from 'react-icons/hi';
import {
  CartItem,
  CartLine,
  cartItemsAtom,
  cartCountAtom,
  lineFingerprint,
  lineSetPrice,
} from '../cart/cartAtoms';
import { capitalizeString } from '../common/utils/capitalizeString';
import { imageAtWidth } from '../common/utils/imageAtWidth';
import { CollapsiblePanel } from '../common/components/CollapsiblePanel';
import { tw } from '../common/utils/tw';

const formatCents = (cents: number | null) =>
  cents == null ? '—' : `$${(cents / 100).toFixed(2)}`;

interface Totals {
  subtotalCents: number | null;
  shippingCents: number | null;
  taxCents: number | null;
  totalCents: number | null;
}

const LineList = ({ lines }: { lines: CartLine[] }) => (
  <ul className='flex flex-col gap-5'>
    {lines.map((line) => {
      const isSet = line.vase != null;
      const total = lineSetPrice(line) * line.quantity;
      return (
        <li key={lineFingerprint(line)} className='flex items-start gap-4'>
          <div className='relative shrink-0'>
            {line.item.main_image && (
              <img
                src={imageAtWidth(line.item.main_image, 200)}
                alt={line.item.name}
                className='border-background-alt h-16 w-16 rounded-md border object-cover'
              />
            )}
            <span className='absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-black text-[11px] font-semibold text-white'>
              {line.quantity}
            </span>
          </div>
          <div className='min-w-0 flex-1'>
            <div className='text-sm font-bold'>
              {isSet ? `${line.item.name} Set` : line.item.name}
            </div>
            {isSet && line.vase ? (
              <div className='mt-1.5 flex flex-col gap-1'>
                <SetComponentRow item={line.item} />
                <SetComponentRow item={line.vase} />
              </div>
            ) : (
              line.item.variant_type && (
                <div className='text-xs opacity-60'>
                  {capitalizeString(line.item.variant_type)}
                </div>
              )
            )}
          </div>
          <div className='shrink-0 text-sm font-bold'>${total.toFixed(2)}</div>
        </li>
      );
    })}
  </ul>
);

// Read-only mirror of the cart pane's `SetSubRow`, scaled down for the
// compact summary layout.
const SetComponentRow = ({ item }: { item: CartItem }) => (
  <div className='flex items-center gap-2 text-xs'>
    {item.main_image && (
      <img
        src={imageAtWidth(item.main_image, 120)}
        alt={item.name}
        className='h-6 w-6 shrink-0 rounded-sm object-cover'
      />
    )}
    <span className='leading-tight opacity-70'>1 × {item.name}</span>
  </div>
);

const TotalsBreakdown = ({
  subtotalCents,
  shippingCents,
  taxCents,
}: Omit<Totals, 'totalCents'>) => (
  <dl className='flex flex-col gap-2 text-sm'>
    <div className='flex items-center justify-between'>
      <dt>Subtotal</dt>
      <dd>{formatCents(subtotalCents)}</dd>
    </div>
    <div className='flex items-center justify-between'>
      <dt>Shipping</dt>
      <dd>
        {shippingCents == null
          ? '—'
          : shippingCents === 0
            ? 'Free'
            : formatCents(shippingCents)}
      </dd>
    </div>
    <div className='flex items-center justify-between'>
      <dt>Estimated taxes</dt>
      <dd>{formatCents(taxCents)}</dd>
    </div>
  </dl>
);

interface CheckoutSummaryProps extends Totals {
  className?: string;
}

// Desktop sidebar variant — vertical column to the right of the form.
export const CheckoutSummary = ({
  subtotalCents,
  shippingCents,
  taxCents,
  totalCents,
  className,
}: CheckoutSummaryProps) => {
  const lines = useAtomValue(cartItemsAtom);
  const itemCount = useAtomValue(cartCountAtom);

  return (
    <aside
      className={tw(
        'border-background-alt bg-background flex flex-col gap-6 border-l p-10 lg:min-h-[calc(100vh-var(--navbar-height))]',
        className
      )}
    >
      <LineList lines={lines} />

      {itemCount > 0 && <div className='border-background-alt border-t' />}

      <TotalsBreakdown
        subtotalCents={subtotalCents}
        shippingCents={shippingCents}
        taxCents={taxCents}
      />

      <div className='border-background-alt border-t pt-4'>
        <div className='flex items-baseline justify-between'>
          <span className='text-base'>Total</span>
          <span className='text-2xl font-bold'>
            <span className='mr-2 text-xs opacity-60'>USD</span>
            {formatCents(totalCents)}
          </span>
        </div>
      </div>
    </aside>
  );
};

// Mobile collapsible variant — sticky bar at the top of the page, header
// shows "Order Summary" + total, body expands to reveal items + breakdown.
export const MobileCheckoutSummary = ({
  subtotalCents,
  shippingCents,
  taxCents,
  totalCents,
  className,
}: CheckoutSummaryProps) => {
  const [open, setOpen] = useState(false);
  const lines = useAtomValue(cartItemsAtom);
  const itemCount = useAtomValue(cartCountAtom);

  return (
    <div
      className={tw(
        'border-background-alt bg-background border-b',
        className
      )}
    >
      <button
        type='button'
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className='flex w-full items-center justify-between px-6 py-4 text-sm'
      >
        <span className='flex items-center gap-2'>
          <span>Order Summary</span>
          <HiOutlineChevronDown
            size={14}
            className={tw('transition-transform', open && 'rotate-180')}
          />
        </span>
        <span className='font-bold'>{formatCents(totalCents)}</span>
      </button>

      <CollapsiblePanel open={open}>
        <div className='flex flex-col gap-6 px-6 pt-2 pb-6'>
          <LineList lines={lines} />

          {itemCount > 0 && <div className='border-background-alt border-t' />}

          <TotalsBreakdown
            subtotalCents={subtotalCents}
            shippingCents={shippingCents}
            taxCents={taxCents}
          />
        </div>
      </CollapsiblePanel>
    </div>
  );
};
