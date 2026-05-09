import {
  ChangeEventHandler,
  FocusEventHandler,
  ReactNode,
  RefObject,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  placeQueries,
  type PlacePrediction,
} from '@/api/places/placeQueries';
import { tw } from '@/src/common/utils/tw';
import { useDismissable } from '@/src/common/hooks/useDismissable';
import type { DeliveryAddress } from './deliveryAddressAtom';

export interface AddressPickerTriggerApi {
  inputProps: {
    value: string;
    onChange: ChangeEventHandler<HTMLInputElement>;
    onFocus: FocusEventHandler<HTMLInputElement>;
    placeholder: string;
    ref: RefObject<HTMLInputElement | null>;
  };
  open: boolean;
  value: DeliveryAddress | null;
  label: string;
}

interface AddressPickerProps {
  value: DeliveryAddress | null;
  onChange: (addr: DeliveryAddress) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  // Extra classes applied to the absolute dropdown panel. Use to inset or
  // extend its left/right edges relative to the trigger container — e.g.
  // to align with the input element rather than its outer padding box.
  panelClassName?: string;
  // Extra classes applied to each result row in the dropdown. Used by
  // consumers that want results to align with surrounding cell padding.
  resultRowClassName?: string;
  trigger: (api: AddressPickerTriggerApi) => ReactNode;
}

const newSessionToken = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const AddressPicker = ({
  value,
  onChange,
  label = 'Sending to',
  placeholder,
  className,
  panelClassName,
  resultRowClassName,
  trigger,
}: AddressPickerProps) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [debounced, setDebounced] = useState('');
  const [session, setSession] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { data: geo } = useQuery(placeQueries.detect());

  const formatted = value?.mainText || value?.description || 'Choose address';

  // Debounce input → debounced. Only update debounced when the trimmed
  // input is ≥3 chars; if the user deletes back below 3 we leave the
  // last valid query in place so stale results stay visible until blur.
  useEffect(() => {
    const id = setTimeout(() => {
      const trimmed = inputValue.trim();
      if (trimmed.length >= 3) setDebounced(trimmed);
    }, 250);
    return () => clearTimeout(id);
  }, [inputValue]);

  const close = () => {
    setOpen(false);
    setInputValue('');
    setDebounced('');
    setSession('');
  };

  useDismissable(containerRef, open, close);

  const onFocus: FocusEventHandler<HTMLInputElement> = () => {
    if (!open) {
      setSession(newSessionToken());
      setOpen(true);
    }
  };

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
    close();
  };

  const showResults = open && debounced.length >= 3;
  const showEmpty =
    showResults && !isFetching && (data?.predictions.length ?? 0) === 0;

  const inputProps = {
    value: inputValue,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setInputValue(e.target.value),
    onFocus,
    placeholder: placeholder ?? formatted,
    ref: inputRef,
  };

  return (
    <div
      ref={containerRef}
      className={tw('relative', className ?? 'inline-block')}
    >
      {trigger({ inputProps, open, value, label })}

      {showResults && (
        <ul
          className={tw(
            'absolute top-full right-0 left-0 z-30 max-h-80 overflow-y-auto bg-white shadow-md',
            panelClassName
          )}
        >
          {showEmpty && (
            <li
              className={tw(
                'font-mulish px-4 py-3 text-sm opacity-50',
                resultRowClassName
              )}
            >
              No results
            </li>
          )}
          {data?.predictions.map((p) => (
            <li key={p.place_id}>
              <button
                type='button'
                onClick={() => select(p)}
                className={tw(
                  'font-mulish hover:bg-background-alt/40 flex w-full cursor-pointer flex-col items-start px-4 py-3 text-left text-sm',
                  resultRowClassName
                )}
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
      )}
    </div>
  );
};
