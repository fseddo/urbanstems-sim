import { createContext, useContext, useRef, RefObject } from 'react';

const NavbarContext = createContext<RefObject<HTMLElement | null> | null>(null);

export const NavbarProvider = ({ children }: { children: React.ReactNode }) => {
  const navbarRef = useRef<HTMLElement | null>(null);

  return (
    <NavbarContext.Provider value={navbarRef}>
      {children}
    </NavbarContext.Provider>
  );
};

export const useNavbar = () => {
  const context = useContext(NavbarContext);
  if (!context) {
    throw new Error('useNavbar must be used within NavbarProvider');
  }
  return context;
};
