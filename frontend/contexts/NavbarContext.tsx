'use client';

import { createContext, useContext, useRef, RefObject } from 'react';

const NavbarContext = createContext<RefObject<HTMLElement | null> | null>(null);

export function NavbarProvider({ children }: { children: React.ReactNode }) {
  const navbarRef = useRef<HTMLElement | null>(null);

  return (
    <NavbarContext.Provider value={navbarRef}>
      {children}
    </NavbarContext.Provider>
  );
}

export function useNavbar() {
  const context = useContext(NavbarContext);
  if (!context) {
    throw new Error('useNavbar must be used within NavbarProvider');
  }
  return context;
}
