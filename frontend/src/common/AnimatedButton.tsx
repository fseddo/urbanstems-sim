import { Link } from '@tanstack/react-router';
import { tw } from './utils/tw';

export const AnimatedButton = (props: {
  onClick?: () => void;
  label: string;
  href: string;
  className?: string;
}) => (
  <Link to={props.href}>
    <button
      onClick={props.onClick}
      className={tw(
        'cursor-pointer rounded-sm border px-7 py-4 text-sm font-bold tracking-[1px] opacity-90 shadow-lg',
        'border-brand-primary text-brand-primary bg-white transition-colors duration-200 hover:border-white hover:bg-transparent hover:text-white',
        props.className
      )}
    >
      {props.label}
    </button>
  </Link>
);
