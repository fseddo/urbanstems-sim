import {
  createRootRouteWithContext,
  Navigate,
  Outlet,
} from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { useRef } from 'react';
import { Footer } from '@/src/common/Footer';
import { Navbar } from '@/src/navbar/Navbar';
import { navbarDropdownOpenAtom } from '@/src/navbar/navbarAtoms';
import { useNavbarCssHeight } from '@/src/navbar/useElementHeight';
import { useHideOnScroll } from '@/src/navbar/useHideOnScroll';
import { useLoadingFavicon } from '@/src/common/useLoadingFavicon';
import { DisclaimerPopup } from '@/src/common/DisclaimerPopup';
import { CartPane } from '@/src/cart/CartPane';

const RootLayout = () => {
  const navbarRef = useRef<HTMLElement | null>(null);
  const dropdownOpen = useAtomValue(navbarDropdownOpenAtom);
  useNavbarCssHeight(navbarRef);
  useHideOnScroll(navbarRef);
  useLoadingFavicon();

  return (
    <>
      <Navbar ref={navbarRef} />
      <CartPane />
      <DisclaimerPopup />
      <div style={{ height: 'var(--navbar-height)' }} />
      <div className='relative'>
        {dropdownOpen && (
          <div className='absolute inset-0 z-40 bg-black/60' />
        )}
        <main className='min-h-screen'>
          <Outlet />
        </main>
        <Footer />
      </div>
    </>
  );
};

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    component: RootLayout,
    notFoundComponent: () => <Navigate to='/' replace />,
  }
);
