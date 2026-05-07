import { Link, LinkProps } from '@tanstack/react-router';
import { tw } from './utils/tw';

type AnimatedButtonProps = Omit<LinkProps, 'children' | 'className'> & {
  label: string;
  onClick?: () => void;
  className?: string;
};

export const AnimatedButton = ({
  label,
  onClick,
  className,
  ...linkProps
}: AnimatedButtonProps) => (
  <Link {...linkProps}>
    <button
      onClick={onClick}
      className={tw(
        'rounded-sm border px-7 py-4',
        'text-[12px] font-extrabold tracking-[1.68px]',
        'bg-white hover:bg-transparent',
        'text-brand-primary hover:text-white',
        'border-brand-primary hover:border-white',
        'cursor-pointer shadow-lg transition-colors duration-200',
        className
      )}
    >
      {label}
    </button>
  </Link>
);
