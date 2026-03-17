import {
  createRootRouteWithContext,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';
import { Footer } from '@/src/common/Footer';
import { NavbarProvider, useNavbar } from '@/src/navbar/NavbarContext';
import { Navbar } from '@/src/navbar/Navbar';
import { useNavbarCssHeight } from '@/src/navbar/useElementHeight';

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

  return (
    <>
      <Navbar ref={navbarRef} />
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
