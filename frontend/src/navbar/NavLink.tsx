import { Link } from '@tanstack/react-router';
import { MouseEventHandler, ReactNode } from 'react';
import { tw } from '../common/utils/tw';

type NavLinkProps = {
  slug: string;
  label?: string;
  children?: ReactNode;
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  onMouseEnter?: MouseEventHandler<HTMLAnchorElement>;
};

export const NavLink = ({
  slug,
  label,
  children,
  className,
  onClick,
  onMouseEnter,
}: NavLinkProps) => (
  <Link
    to='/collections/$slug'
    params={{ slug }}
    className={tw('font-crimson text-brand-primary hover:opacity-60', className)}
    onClick={onClick}
    onMouseEnter={onMouseEnter}
  >
    {children ?? label}
  </Link>
);
