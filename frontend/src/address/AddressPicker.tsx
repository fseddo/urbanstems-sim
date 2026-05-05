import { ReactNode, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SlLocationPin } from 'react-icons/sl';
import {
  placeQueries,
  type PlacePrediction,
} from '@/api/places/placeQueries';
import { tw } from '@/src/common/utils/tw';
import { useDismissable } from '@/src/common/useDismissable';
import type { DeliveryAddress } from './deliveryAddressAtom';

export interface AddressPickerTriggerApi {
  open: boolean;
  toggle: () => void;
  value: DeliveryAddress | null;
  formatted: string;
  label: string;
}

interface AddressPickerProps {
  value: DeliveryAddress | null;
  onChange: (addr: DeliveryAddress) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  trigger?: (api: AddressPickerTriggerApi) => ReactNode;
}

const newSessionToken = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const AddressPicker = ({
  value,
  onChange,
  label = 'Sending to',
  placeholder = 'Search address',
  className,
  trigger,
}: AddressPickerProps) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [debounced, setDebounced] = useState('');
  const [session, setSession] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { data: geo } = useQuery(placeQueries.detect());

  useEffect(() => {
    const id = setTimeout(() => setDebounced(input.trim()), 250);
    return () => clearTimeout(id);
  }, [input]);

  useDismissable(containerRef, open, () => setOpen(false));

  // A Google Places "session" begins on open and ends on selection — bundling
  // keystrokes + the final details call into a single billable session.
  useEffect(() => {
    if (open) {
      setSession(newSessionToken());
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setInput('');
      setDebounced('');
    }
  }, [open]);

  const toggle = () => setOpen((o) => !o);

  const { data, isFetching } = useQuery(
    placeQueries.autocomplete({
      q: debounced,
      lat: geo?.lat,
      lng: geo?.lng,
      session,
    })
  );

  const select = async (p: PlacePrediction) => {
    const detail = await queryClient.fetchQuery(
      placeQueries.details(p.place_id, session)
    );
    onChange({
      placeId: detail.place_id,
      description: detail.description || p.description,
      mainText: p.main_text,
      secondaryText: p.secondary_text,
      lat: detail.lat,
      lng: detail.lng,
    });
    setOpen(false);
    setSession('');
  };

  const formatted = value?.mainText || value?.description || 'Choose address';

  const showEmpty =
    debounced.length >= 3 &&
    !isFetching &&
    (data?.predictions.length ?? 0) === 0;

  return (
    <div
      ref={containerRef}
      className={tw('relative', className ?? 'inline-block')}
    >
      {trigger ? (
        trigger({ open, toggle, value, formatted, label })
      ) : (
        <button
          type='button'
          onClick={toggle}
          className='border-brand-primary text-brand-primary flex items-center gap-3 border bg-white px-6 py-5 font-bold transition-colors hover:bg-white/60'
        >
          <SlLocationPin />
          <span>
            {label}: <span className='font-normal'>{formatted}</span>
          </span>
        </button>
      )}

      {open && (
        <div className='absolute top-full left-4 z-30 mt-3 w-[28rem] max-w-[calc(100vw-2rem)] bg-white shadow-md'>
          <div className='border-background-alt absolute -top-2 left-6 h-4 w-4 rotate-45 border-t border-l bg-white' />

          <div className='px-4 pt-4 pb-2'>
            <input
              ref={inputRef}
              type='text'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholder}
              className='font-mulish w-full border-b border-black/20 bg-transparent py-2 text-base outline-none focus:border-black/60'
            />
          </div>

          <ul className='max-h-80 overflow-y-auto pb-2'>
            {debounced.length < 3 && (
              <li className='font-mulish px-4 py-3 text-sm opacity-50'>
                Type at least 3 characters
              </li>
            )}
            {showEmpty && (
              <li className='font-mulish px-4 py-3 text-sm opacity-50'>
                No results
              </li>
            )}
            {data?.predictions.map((p) => (
              <li key={p.place_id}>
                <button
                  type='button'
                  onClick={() => select(p)}
                  className='font-mulish hover:bg-background-alt/40 flex w-full cursor-pointer flex-col items-start px-4 py-3 text-left text-sm'
                >
                  <span>{p.main_text || p.description}</span>
                  {p.secondary_text && (
                    <span className='text-xs opacity-60'>
                      {p.secondary_text}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
