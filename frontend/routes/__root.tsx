import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';
import { Footer } from '@/src/common/Footer';
import {
  NavbarProvider,
  useNavbar,
  useShopDropdown,
} from '@/src/navbar/NavbarContext';
import { Navbar } from '@/src/navbar/Navbar';
import { useNavbarCssHeight } from '@/src/navbar/useElementHeight';
import { useHideOnScroll } from '@/src/navbar/useHideOnScroll';
import { useLoadingFavicon } from '@/src/common/useLoadingFavicon';
import { DisclaimerPopup } from '@/src/common/DisclaimerPopup';

function RootLayout() {
  return (
    <NavbarProvider>
      <RootLayoutInner />
    </NavbarProvider>
  );
}

function RootLayoutInner() {
  const navbarRef = useNavbar();
  const { shopOpen } = useShopDropdown();
  useNavbarCssHeight(navbarRef);
  useHideOnScroll(navbarRef);
  useLoadingFavicon();

  return (
    <>
      <Navbar ref={navbarRef} />
      <DisclaimerPopup />
      <div style={{ height: 'var(--navbar-height)' }} />
      <div className='relative'>
        {shopOpen && <div className='absolute inset-0 z-40 bg-black/60' />}
        <main className='min-h-screen'>
          <Outlet />
        </main>
        <Footer />
      </div>
    </>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    component: RootLayout,
  }
);
