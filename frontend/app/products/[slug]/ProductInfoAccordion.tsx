import parse from 'html-react-parser';
import { useState } from 'react';
import { FiMinus, FiPlus } from 'react-icons/fi';

export const ProductInfoAccordion = ({
  label,
  data,
}: {
  label: string;
  data: string | null;
}) => {
  const [isExpanded, setIsExpanded] = useState(label === 'Description');
  return (
    <div
      className={`border-background-alt/80 flex flex-col gap-4 border-b py-4 ${label === 'Description' ? 'border-t' : ''}`}
    >
      <header className='flex items-center justify-between'>
        <div className='font-bold'>{label}</div>
        <div
          className='cursor-pointer opacity-70'
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <FiMinus /> : <FiPlus />}
        </div>
      </header>
      {isExpanded && data && (
        <div className='flex flex-col gap-4 text-sm opacity-90'>
          {parse(data)}
        </div>
      )}
    </div>
  );
};
