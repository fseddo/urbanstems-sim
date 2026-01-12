'use client';

import { Navbar } from '@/components/navbar/Navbar';
import { Footer } from '@/components/Footer';
import { NavbarProvider, useNavbar } from '@/contexts/NavbarContext';

function LayoutContentInner({ children }: { children: React.ReactNode }) {
  const navbarRef = useNavbar();

  return (
    <>
      <Navbar ref={navbarRef} />
      <main className='min-h-screen'>{children}</main>
      <Footer />
    </>
  );
}

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NavbarProvider>
      <LayoutContentInner>{children}</LayoutContentInner>
    </NavbarProvider>
  );
}
