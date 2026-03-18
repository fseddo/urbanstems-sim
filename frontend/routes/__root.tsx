import {
  createRootRouteWithContext,
  Outlet,
} from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';
import { Footer } from '@/src/common/Footer';
import { NavbarProvider, useNavbar } from '@/src/navbar/NavbarContext';
import { Navbar } from '@/src/navbar/Navbar';
import { useNavbarCssHeight } from '@/src/navbar/useElementHeight';
import { useHideOnScroll } from '@/src/navbar/useHideOnScroll';
import { useLoadingFavicon } from '@/src/common/useLoadingFavicon';

function RootLayout() {
  return (
    <NavbarProvider>
      <RootLayoutInner />
    </NavbarProvider>
  );
}

function RootLayoutInner() {
  const navbarRef = useNavbar();
  useNavbarCssHeight(navbarRef);
  useHideOnScroll(navbarRef);
  useLoadingFavicon();

  return (
    <>
      <Navbar ref={navbarRef} />
      <div style={{ height: 'var(--navbar-height)' }} />
      <main className='min-h-screen'>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    component: RootLayout,
  }
);
