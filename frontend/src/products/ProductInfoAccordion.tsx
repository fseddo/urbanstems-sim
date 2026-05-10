import parse from 'html-react-parser';
import { useState } from 'react';
import { FiMinus, FiPlus } from 'react-icons/fi';
import { CollapsiblePanel } from '../common/components/CollapsiblePanel';
import { tw } from '../common/utils/tw';

export const ProductInfoAccordion = ({
  label,
  data,
  defaultOpen = false,
}: {
  label: string;
  data: string | null;
  defaultOpen?: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultOpen);
  return (
    <div
      className={tw(
        'border-background-alt/80 flex flex-col border-b py-4',
        label === 'Description' ? 'border-t' : ''
      )}
    >
      <button
        type='button'
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        className='flex w-full items-center justify-between text-left'
      >
        <span className='font-bold'>{label}</span>
        <span className='opacity-70'>
          {isExpanded ? <FiMinus /> : <FiPlus />}
        </span>
      </button>
      <CollapsiblePanel open={isExpanded}>
        {data && (
          <div className='flex flex-col gap-4 pt-4 text-sm opacity-90'>
            {parse(data)}
          </div>
        )}
      </CollapsiblePanel>
    </div>
  );
};
