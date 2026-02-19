'use client';

import Link, { LinkProps } from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { findPrefetchRoute } from '@/lib/prefetch/routes';
import { useCallback, ComponentProps } from 'react';

type PrefetchLinkProps = LinkProps & Omit<ComponentProps<'a'>, keyof LinkProps>;

export const PrefetchLink = ({
  href,
  onMouseEnter,
  children,
  ...props
}: PrefetchLinkProps) => {
  const queryClient = useQueryClient();

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      const path = typeof href === 'string' ? href : href.pathname ?? '';
      const match = findPrefetchRoute(path);

      if (match) {
        match.route.prefetch(queryClient, match.params);
      }

      onMouseEnter?.(e);
    },
    [href, queryClient, onMouseEnter]
  );

  return (
    <Link href={href} onMouseEnter={handleMouseEnter} {...props}>
      {children}
    </Link>
  );
};
